-- MVP: Monitoramento de Rotina de Cuidados
-- Schema principal. Execute este arquivo no SQL Editor do Supabase
-- (ou via `supabase db push` / CLI) antes de seed.sql.

create extension if not exists "pgcrypto";

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists caregivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  caregiver_id uuid not null references caregivers(id),
  start_time time not null,
  end_time time not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists shifts_patient_date_idx on shifts (patient_id, date);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id),
  scheduled_time time not null,
  title text not null,
  category text not null,
  instructions text,
  sort_order int not null default 0,
  active boolean not null default true
);

create index if not exists tasks_patient_idx on tasks (patient_id, active, sort_order);

do $$ begin
  create type task_execution_status as enum ('EM_ANDAMENTO', 'CONCLUIDA');
exception
  when duplicate_object then null;
end $$;

create table if not exists task_executions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  shift_id uuid not null references shifts(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status task_execution_status not null default 'EM_ANDAMENTO',
  is_delayed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint completed_requires_completed_at
    check (status <> 'CONCLUIDA' or completed_at is not null)
);

create index if not exists task_executions_task_idx on task_executions (task_id, started_at desc);
create index if not exists task_executions_shift_idx on task_executions (shift_id);

-- Nunca permitir apagar execuções (princípio de auditoria).
revoke delete on task_executions from anon, authenticated;

-- =========================================================
-- Row Level Security
--
-- MVP sem autenticação sofisticada: liberamos leitura pública e
-- escrita mínima necessária para o fluxo do cuidador, mas protegemos
-- o histórico contra edição/exclusão após a tarefa ser concluída.
-- =========================================================

alter table caregivers enable row level security;
alter table patients enable row level security;
alter table shifts enable row level security;
alter table tasks enable row level security;
alter table task_executions enable row level security;

create policy "caregivers are publicly readable"
  on caregivers for select
  using (true);

create policy "patients are publicly readable"
  on patients for select
  using (true);

create policy "shifts are publicly readable"
  on shifts for select
  using (true);

create policy "shifts can be created"
  on shifts for insert
  with check (true);

create policy "tasks are publicly readable"
  on tasks for select
  using (true);

create policy "task_executions are publicly readable"
  on task_executions for select
  using (true);

-- Cuidador pode criar uma execução (INICIAR TAREFA).
create policy "task_executions can be started"
  on task_executions for insert
  with check (status = 'EM_ANDAMENTO' and completed_at is null);

-- Cuidador só pode atualizar (FINALIZAR TAREFA) enquanto a execução
-- ainda não foi concluída. Uma vez com completed_at preenchido, a
-- linha fica imutável (auditoria).
create policy "task_executions can be completed once"
  on task_executions for update
  using (completed_at is null)
  with check (status = 'CONCLUIDA' and completed_at is not null);

-- Nenhuma policy de delete é criada de propósito: exclusão fica bloqueada.

-- Habilita Supabase Realtime (postgres_changes) para a tela de
-- monitoramento acompanhar início/fim de tarefas automaticamente.
alter publication supabase_realtime add table task_executions;
