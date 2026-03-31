"use client";

import { trpc } from "@/lib/trpc";

export function SessionStatusCard() {
  const { data, isLoading, error } = trpc.auth.getUserSession.useQuery();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading session from tRPC...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive-foreground">
        Session check failed: {error.message}
      </p>
    );
  }

  if (!data?.isAuthenticated) {
    return <p className="text-sm text-muted-foreground">No active session.</p>;
  }

  return (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>
        Signed in as{" "}
        <span className="font-medium text-foreground">
          {data.user?.name ?? "Unnamed user"}
        </span>
      </p>
      <p className="text-muted-foreground">{data.user?.email}</p>
    </div>
  );
}
