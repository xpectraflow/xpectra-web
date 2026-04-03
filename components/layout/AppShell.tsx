"use client";

import { usePathname } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

type AppShellProps = {
  children: React.ReactNode;
};

const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password"]);

// Routes that render a fully custom layout (no sidebar/header from AppShell)
const IMMERSIVE_ROUTE_PREFIXES = ["/playground"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname !== null && AUTH_ROUTES.has(pathname);
  const isImmersive =
    pathname !== null &&
    IMMERSIVE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAuthRoute) {
    return <AuthLayout>{children}</AuthLayout>;
  }

  if (isImmersive) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
