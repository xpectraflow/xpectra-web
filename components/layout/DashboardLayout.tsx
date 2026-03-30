"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { ClusterProvider } from "@/contexts/ClusterContext";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <TrpcProvider>
        <DeviceProvider>
          <ClusterProvider>
            <div className="flex h-screen overflow-hidden bg-gray-950">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
          </ClusterProvider>
        </DeviceProvider>
      </TrpcProvider>
    </SessionProvider>
  );
}
