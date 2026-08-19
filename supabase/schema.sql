-- MVP: Monitoramento de Rotina de Cuidados
-- Schema principal (v2 — com autenticação via Supabase Auth).
-- Execute este arquivo no SQL Editor do Supabase (ou via `supabase db
-- push` / CLI) antes de seed.sql.
--
-- Se você já tinha rodado a versão anterior do schema (tabelas em
-- inglês: patients/caregivers/shifts/tasks/task_executions), rode este
-- bloco antes para começar do zero:
--
--   drop table if exists task_executions cascade;
--   drop table if exists shifts cascade;
--   drop table if exists tasks cascade;
--   drop table if exists caregivers cascade;
--   drop table if exists patients cascade;

create extension if not exists "pgcrypto";

-- =========================================================
-- Tabelas
-- =========================================================

create table if not exists paciente (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

-- Perfil de cada usuário autenticado (Supabase Auth). O id é o mesmo do
-- auth.users — não existe cadastro de usuário por texto livre.
create table if not exists usuario (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('cuidador', 'familia')),
  created_at timestamptz not null default now()
);

create table if not exists tarefa (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references paciente(id),
  horario_previsto time not null,
  titulo text not null,
  categoria text not null,
  instrucoes text,
  ordem int not null default 0,
  ativo boolean not null default true
);

create index if not exists tarefa_paciente_idx on tarefa (paciente_id, ativo, ordem);

do $$ begin
  create type execucao_status as enum ('EM_ANDAMENTO', 'CONCLUIDA');
exception
  when duplicate_object then null;
end $$;

create table if not exists execucao (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references tarefa(id),
  cuidador_id uuid not null references usuario(id),
  inicio timestamptz not null default now(),
  fim timestamptz,
  status execucao_status not null default 'EM_ANDAMENTO',
  -- inicio - horario_previsto (do dia), em minutos. Pode ser negativo
  -- (iniciada antes do horário). Calculado pelo app no momento do
  -- INICIAR e nunca recalculado depois — histórico imutável.
  atraso_minutos int not null default 0,
  created_at timestamptz not null default now(),
  constraint fim_requer_status_concluida
    check (status <> 'CONCLUIDA' or fim is not null)
);

create index if not exists execucao_tarefa_idx on execucao (tarefa_id, inicio desc);
create index if not exists execucao_inicio_idx on execucao (inicio);

-- Nunca permitir apagar execuções (princípio de auditoria).
revoke delete on execucao from anon, authenticated;

-- =========================================================
-- Row Level Security
--
-- Agora com autenticação real: cuidador e família fazem login (Supabase
-- Auth, e-mail/senha). Família tem acesso somente leitura. Só o próprio
-- cuidador autenticado pode iniciar uma execução em seu nome; qualquer
-- cuidador autenticado pode finalizar uma execução em andamento (cobre
-- troca de plantão no meio de uma tarefa). Depois de concluída, uma
-- execução fica imutável (sem policy de update que permita reabri-la, e
-- sem policy de delete).
-- =========================================================

alter table paciente enable row level security;
alter table usuario enable row level security;
alter table tarefa enable row level security;
alter table execucao enable row level security;

create policy "paciente legivel por autenticados"
  on paciente for select
  using (auth.role() = 'authenticated');

create policy "usuario legivel por autenticados"
  on usuario for select
  using (auth.role() = 'authenticated');

create policy "tarefa legivel por autenticados"
  on tarefa for select
  using (auth.role() = 'authenticated');

create policy "execucao legivel por autenticados"
  on execucao for select
  using (auth.role() = 'authenticated');

-- Cuidador pode criar uma execução em seu próprio nome (INICIAR TAREFA).
create policy "execucao pode ser iniciada pelo proprio cuidador"
  on execucao for insert
  with check (
    cuidador_id = auth.uid()
    and status = 'EM_ANDAMENTO'
    and fim is null
    and exists (select 1 from usuario u where u.id = auth.uid() and u.tipo = 'cuidador')
  );

-- Qualquer cuidador autenticado pode finalizar uma execução ainda em
-- andamento (cobre troca de plantão). Uma vez com fim preenchido, a
-- linha fica imutável (auditoria) — a policy só permite update enquanto
-- fim ainda é nulo.
create policy "execucao pode ser finalizada por cuidador autenticado"
  on execucao for update
  using (
    fim is null
    and exists (select 1 from usuario u where u.id = auth.uid() and u.tipo = 'cuidador')
  )
  with check (
    status = 'CONCLUIDA' and fim is not null
  );

-- Nenhuma policy de delete é criada de propósito: exclusão fica bloqueada.
-- Nenhuma policy de insert/update é criada para paciente/tarefa/usuario:
-- são administradas manualmente pelo SQL Editor (que usa a role
-- postgres/service_role e ignora RLS).

-- Habilita Supabase Realtime (postgres_changes) para a tela de
-- monitoramento acompanhar início/fim de tarefas automaticamente.
alter publication supabase_realtime add table execucao;
