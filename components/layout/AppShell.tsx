"use client";

import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type AppShellProps = {
  children: React.ReactNode;
};

const AUTH_ROUTES = new Set(["/login", "/register"]);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname !== null && AUTH_ROUTES.has(pathname);

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
