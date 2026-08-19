import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Não lançamos erro aqui: este módulo é avaliado durante o build (SSR/
  // prerender) mesmo antes de qualquer chamada real ao Supabase, que só
  // acontece no navegador. Sem as variáveis definidas, as telas mostram o
  // erro de carregamento normalmente em vez de quebrar o build.
  console.warn(
    "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
