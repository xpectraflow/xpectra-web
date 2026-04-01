"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { ClusterProvider } from "@/contexts/ClusterContext";
import { trpc } from "@/lib/trpc";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <TrpcProvider>
        <DashboardContent>{children}</DashboardContent>
      </TrpcProvider>
    </SessionProvider>
  );
}

function DashboardContent({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { data: orgs, isSuccess } = trpc.organizations.list.useQuery();
  const pathname = usePathname();
  const isSetupPage = pathname === "/organizations/setup";
  useEffect(() => {
    if (isSuccess && orgs.length === 0 && !isSetupPage) {
      router.replace("/organizations/setup");
    }
  }, [router, orgs, isSuccess, isSetupPage]);



  if (isSuccess && orgs.length === 0 && !isSetupPage) {
    return null;
  }

  return (
    <DeviceProvider>
      <ClusterProvider>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Header />
            <div className="px-8 pb-8">{children}</div>
          </main>
        </div>
      </ClusterProvider>
    </DeviceProvider>
  );
}
