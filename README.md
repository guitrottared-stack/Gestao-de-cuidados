# Gestão de Cuidados — MVP de Monitoramento de Rotina

Aplicação web responsiva (mobile-first) para acompanhar a execução da rotina
diária de cuidados de uma pessoa acamada. Duas telas:

- **`/cuidador`** — o cuidador vê a tarefa atual, inicia e finaliza cada
  tarefa. Horários de início/fim são registrados automaticamente.
- **`/monitoramento`** — a família acompanha o plantão em tempo real
  (Supabase Realtime), com status geral, indicadores do dia e alerta de
  tarefas atrasadas.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres + Realtime) + Lucide React. PWA simples (manifest + service worker
de shell).

## 1. Pré-requisitos

- Node.js 20+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Configurar o Supabase

1. Crie um projeto novo em [supabase.com](https://supabase.com/dashboard).
2. Abra **SQL Editor** no painel do projeto e execute, nesta ordem:
   - o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) — cria as
     tabelas (`patients`, `caregivers`, `shifts`, `tasks`, `task_executions`),
     as policies de RLS e habilita o Realtime na tabela `task_executions`.
   - o conteúdo de [`supabase/seed.sql`](./supabase/seed.sql) — cadastra o
     paciente, os cuidadores e a rotina diária completa (todos os horários,
     medicações e instruções exatamente como especificados).
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public key**

O projeto usa apenas a chave `anon` (RLS cuida das permissões — leitura
pública, e escrita restrita ao fluxo INICIAR → FINALIZAR, sem edição nem
exclusão de execuções já registradas). Não é necessário configurar
autenticação de usuários neste MVP.

## 3. Configurar o projeto localmente

```bash
npm install
cp .env.local.example .env.local
```

Edite `.env.local` com os valores copiados do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
```

## 4. Rodar em desenvolvimento

```bash
npm run dev
```

Abra no navegador (ou no celular, na mesma rede, via `http://SEU-IP:3000`):

- `http://localhost:3000/cuidador` — tela do cuidador
- `http://localhost:3000/monitoramento` — tela da família

Na primeira vez em `/cuidador`, selecione o cuidador e o turno (diurno
06:00–18:00 ou noturno 18:00–06:00); a seleção fica salva no dispositivo
(localStorage) e cria/reaproveita o plantão do dia no banco.

## 5. Build de produção

```bash
npm run build
npm run start
```

## Como o fluxo funciona

- Cada tarefa da rotina tem um horário programado (`tasks.scheduled_time`).
- Enquanto não há execução registrada: tarefa aparece **PENDENTE** (antes do
  horário) ou **ATRASADA** (depois do horário), calculado no cliente a cada
  30s — nada precisa ser gravado no banco para isso.
- Ao tocar em **INICIAR TAREFA**, o app grava uma linha em
  `task_executions` com `started_at = now()` — vira **EM ANDAMENTO**.
- Ao tocar em **FINALIZAR TAREFA**, o app atualiza essa mesma linha com
  `completed_at = now()` e marca `is_delayed = true` se o início ocorreu
  depois do horário programado — vira **CONCLUÍDA** (ou **CONCLUÍDA COM
  ATRASO** na exibição).
- As policies de RLS impedem editar uma execução já concluída e não existe
  policy de `delete` na tabela `task_executions`: o histórico é imutável por
  design (princípio de auditoria do MVP).
- A tela `/monitoramento` assina mudanças em `task_executions` (e `shifts`)
  via Supabase Realtime e atualiza sozinha, sem precisar recarregar a
  página.

## Estrutura

```
src/app/cuidador          tela do cuidador
src/app/monitoramento     tela da família
src/lib/                  cliente Supabase, tipos, cálculo de status, hooks
src/components/           componentes de UI compartilhados
supabase/schema.sql       tabelas + RLS + realtime
supabase/seed.sql         paciente, cuidadores e rotina diária (dados fixos)
```

## Limitações conhecidas do MVP (propositais)

Conforme escopo definido: sem autenticação sofisticada, sem edição da
rotina pelo cuidador, sem notificações push, sem múltiplos pacientes, sem
relatórios. O PWA é básico (instalável, cache do shell estático); os ícones
192x192/512x512 do manifest são gerados dinamicamente pelo próprio Next.js.
