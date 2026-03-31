"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 mb-6 border-b border-gray-800 bg-gray-950/95 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-white">
            Xpectra
          </Link>
          <nav className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/experiments" className="transition hover:text-gray-200">
              Experiments
            </Link>
            <Link href="/datasets" className="transition hover:text-gray-200">
              Datasets
            </Link>
            <Link href="/usage" className="transition hover:text-gray-200">
              Usage
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-200">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-gray-500">{session?.user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
