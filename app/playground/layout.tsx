"use client";

import { ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { PlaygroundContext } from "@/components/playground/PlaygroundContext";

function PlaygroundShell({ children }: { children: ReactNode }) {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);

  return (
    <PlaygroundContext.Provider value={{ selectedExperimentId, setSelectedExperimentId }}>
      <div className="flex h-screen overflow-hidden bg-[#131313] text-foreground">
        <PlaygroundSidebar
          selectedExperimentId={selectedExperimentId}
          onSelectExperiment={setSelectedExperimentId}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </PlaygroundContext.Provider>
  );
}

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TrpcProvider>
        <DeviceProvider>
          <PlaygroundShell>{children}</PlaygroundShell>
        </DeviceProvider>
      </TrpcProvider>
    </SessionProvider>
  );
}
