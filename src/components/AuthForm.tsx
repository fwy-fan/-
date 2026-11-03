"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";

export function AuthForm({ locale, mode }: { locale: Locale; mode: "login" | "register" }) {
  const t = dictionaries[locale];
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(t.errors[body.error] ?? t.errors.generic);
      return;
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/studio");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold">
        {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
      </h1>
      <div>
        <label className="label" htmlFor="email">{t.auth.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.auth.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="field"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {mode === "login" ? t.auth.submitLogin : t.auth.submitRegister}
      </button>
      <p className="text-center text-sm">
        <Link href={mode === "login" ? "/register" : "/login"} className="text-accent hover:underline">
          {mode === "login" ? t.auth.toRegister : t.auth.toLogin}
        </Link>
      </p>
    </form>
  );
}
