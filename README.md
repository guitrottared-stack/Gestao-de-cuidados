# Gestão de Cuidados — MVP de Monitoramento de Rotina

Aplicação web responsiva (mobile-first) para acompanhar a execução da rotina
diária de cuidados de uma pessoa acamada. Duas telas, com login:

- **`/cuidador`** — o cuidador (login por e-mail/senha) vê a tarefa atual,
  inicia e finaliza cada tarefa. Horários de início/fim são registrados
  automaticamente.
- **`/monitoramento`** — a família (login separado, só leitura) acompanha o
  plantão em tempo real (Supabase Realtime), com status geral, indicadores
  do dia e alerta de tarefas atrasadas.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres + Auth + Realtime) + Lucide React. PWA simples (manifest +
service worker de shell).

## 1. Pré-requisitos

- Node.js 20+ e npm
- Uma conta gratuita no [Supabase](https://supabase.com)

## 2. Configurar o Supabase (banco de dados)

1. Crie um projeto novo em [supabase.com](https://supabase.com/dashboard).
2. Abra **SQL Editor** no painel do projeto e execute, nesta ordem:
   - o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) — cria as
     tabelas (`paciente`, `usuario`, `tarefa`, `execucao`), as policies de
     RLS e habilita o Realtime na tabela `execucao`.
   - o conteúdo de [`supabase/seed.sql`](./supabase/seed.sql) — cadastra o
     paciente (Dona Elza) e a rotina diária completa (todos os horários,
     medicações e instruções exatamente como especificados).
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **anon public key**

⚠️ Se você rodou uma versão anterior deste projeto (tabelas em inglês —
`patients`/`caregivers`/`shifts`/`tasks`/`task_executions`), apague-as
antes: há um bloco de `drop table` comentado no topo do `schema.sql`.

## 3. Criar as contas de login (cuidador e família)

Não existe cadastro público — cada conta é criada manualmente por quem
administra o app:

1. No painel do Supabase → **Authentication → Users → Add user**.
   Preencha e-mail e senha, marque **"Auto Confirm User"**, clique em criar.
2. Copie o **UID** do usuário recém-criado (aparece na lista de usuários).
3. Volte no **SQL Editor** e rode (trocando os valores):

   ```sql
   insert into usuario (id, nome, tipo)
   values ('COLE-O-UID-AQUI', 'Maria', 'cuidador');
   ```

   Use `tipo = 'cuidador'` para quem vai iniciar/finalizar tarefas, ou
   `tipo = 'familia'` para quem só acompanha (somente leitura).

Repita para cada cuidador e para ao menos uma conta da família. Sem essa
linha em `usuario`, o login funciona mas o app não sabe se a pessoa é
cuidador ou família (mostra uma mensagem pedindo pra vincular a conta).

## 4. Configurar o projeto localmente

```bash
npm install
cp .env.local.example .env.local
```

Edite `.env.local` com os valores copiados do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-publica
```

## 5. Rodar em desenvolvimento

```bash
npm run dev
```

Abra no navegador (ou no celular, na mesma rede, via `http://SEU-IP:3000`):

- `http://localhost:3000/cuidador` — tela do cuidador (login exige conta com `tipo = 'cuidador'`)
- `http://localhost:3000/monitoramento` — tela da família (qualquer conta logada pode ver, cuidador ou família)

O plantão é fixo, das 07:00 às 19:00 — não há mais seleção de turno.

## 6. Build de produção

```bash
npm run build
npm run start
```

## Como o fluxo funciona

- Cada tarefa da rotina tem um horário programado (`tarefa.horario_previsto`).
- Enquanto não há execução registrada: tarefa aparece **PENDENTE** (antes do
  horário) ou **ATRASADA** (depois do horário), calculado no cliente a cada
  30s.
- Ao tocar em **INICIAR TAREFA**, o app grava uma linha em `execucao` com
  `inicio = now()`, `cuidador_id` = o usuário autenticado, e
  `atraso_minutos = inicio - horario_previsto` (pode ser negativo, se
  iniciada antes da hora). Se `atraso_minutos > 5`, mostra um aviso
  "⚠️ Iniciada com X de atraso."
- Ao tocar em **FINALIZAR TAREFA**, grava `fim = now()`. A tarefa concluída
  é classificada como:
  - **CONCLUÍDA NO HORÁRIO** — atraso ≤ 5 minutos (tolerância).
  - **CONCLUÍDA COM ATRASO** — atraso > 5 minutos.
- As policies de RLS impedem editar uma execução já concluída, e não existe
  policy de `delete` na tabela `execucao`: o histórico é imutável por
  design (princípio de auditoria).
- Qualquer cuidador autenticado pode finalizar uma execução em andamento
  (não precisa ser quem iniciou) — cobre troca de plantão no meio de uma
  tarefa. Só o próprio cuidador pode iniciar uma execução em seu nome.
- A tela `/monitoramento` assina mudanças em `execucao` via Supabase
  Realtime e atualiza sozinha. O status geral é:
  - 🟢 **NENHUMA TAREFA PENDENTE** — nenhuma tarefa atrasada agora.
  - 🔴 **HÁ UMA TAREFA ATRASADA** — pelo menos uma tarefa não iniciada além
    do horário previsto.
- **Alerta de registro em lote**: se 2+ tarefas forem concluídas com
  início/fim dentro de uma janela de 5 minutos entre si, mas horários
  previstos espalhados por mais de 1h, a família vê um aviso visual (não
  bloqueia o cuidador).

## Estrutura

```
src/app/cuidador          tela do cuidador (auth + iniciar/finalizar)
src/app/monitoramento     tela da família (auth, somente leitura)
src/lib/                  cliente Supabase, auth, tipos, cálculo de status/atraso, hooks
src/components/           componentes de UI compartilhados
supabase/schema.sql       tabelas (paciente/usuario/tarefa/execucao) + RLS + realtime
supabase/seed.sql         paciente e rotina diária (dados fixos)
```

## Limitações conhecidas do MVP (propositais)

Sem cadastro público de contas (criadas manualmente pelo administrador),
sem edição da rotina pelo cuidador, sem notificações push, sem múltiplos
pacientes, sem relatórios. O PWA é básico (instalável, cache do shell
estático); os ícones 192x192/512x512 do manifest são gerados dinamicamente
pelo próprio Next.js.
