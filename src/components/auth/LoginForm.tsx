"use client";

import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";

export function LoginForm({
  title,
  subtitle,
  onSubmit,
}: {
  title: string;
  subtitle: string;
  onSubmit: (email: string, senha: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const message = await onSubmit(email, senha);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-500">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-white p-4 text-base"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-white p-4 text-base"
        />

        {error && <p className="text-center text-sm font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-4 text-lg font-bold text-white shadow-sm disabled:opacity-60"
        >
          <LogIn size={20} />
          {busy ? "Entrando..." : "ENTRAR"}
        </button>
      </form>
    </div>
  );
}
