"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-primary">Xpectra</p>
        <h1 className="text-2xl font-semibold text-foreground">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to request a password reset.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-muted-foreground">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition focus:ring-1"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Request reset
        </button>
      </form>

      {submitted && (
        <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground">
          Reset flow is not yet wired to email delivery. Contact admin for reset.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/login" className="text-primary hover:opacity-90">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
