"use client";

import { trpc } from "@/lib/trpc";

export function SessionStatusCard() {
  const { data, isLoading, error } = trpc.auth.getUserSession.useQuery();

  if (isLoading) {
    return (
      <p className="text-sm text-gray-400">Loading session from tRPC...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-300">
        Session check failed: {error.message}
      </p>
    );
  }

  if (!data?.isAuthenticated) {
    return <p className="text-sm text-gray-400">No active session.</p>;
  }

  return (
    <div className="space-y-1 text-sm text-gray-300">
      <p>
        Signed in as{" "}
        <span className="font-medium text-white">
          {data.user?.name ?? "Unnamed user"}
        </span>
      </p>
      <p className="text-gray-400">{data.user?.email}</p>
    </div>
  );
}
