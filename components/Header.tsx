"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-10 mb-6 border-b border-border bg-background/95 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/experiments" className="transition hover:text-foreground">
              Experiments
            </Link>
            <Link href="/datasets" className="transition hover:text-foreground">
              Datasets
            </Link>
            <Link href="/usage" className="transition hover:text-foreground">
              Usage
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-foreground">{session?.user?.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-input px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
