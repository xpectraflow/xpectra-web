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
        <p className="text-sm uppercase tracking-wide text-blue-400">Xpectra</p>
        <h1 className="text-2xl font-semibold text-white">Forgot password</h1>
        <p className="text-sm text-gray-400">
          Enter your email to request a password reset.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-gray-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none ring-blue-500 transition focus:ring-1"
            required
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Request reset
        </button>
      </form>

      {submitted && (
        <p className="rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2 text-sm text-gray-300">
          Reset flow is not yet wired to email delivery. Contact admin for reset.
        </p>
      )}

      <p className="text-sm text-gray-400">
        Remembered your password?{" "}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
