"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Usuario } from "./types";

interface UseAuthResult {
  user: User | null;
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, senha: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

/** Sessão de autenticação (Supabase Auth) + perfil (tabela `usuario`: nome/tipo). */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fetchedUserId, setFetchedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUser(data.session?.user ?? null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("usuario")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setUsuario(data);
        setFetchedUserId(user.id);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, senha: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      const message = error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message;
      setError(message);
      return message;
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUsuario(null);
  }, []);

  return {
    user: user ?? null,
    usuario: user ? usuario : null,
    loading: user === undefined || (user !== null && fetchedUserId !== user.id),
    error,
    signIn,
    signOut,
  };
}
