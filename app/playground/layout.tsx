"use client";

import { ReactNode, useState, useCallback } from "react";
import { SessionProvider } from "next-auth/react";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { PlaygroundContext, PlottedDataset } from "@/components/playground/PlaygroundContext";

function PlaygroundShell({ children }: { children: ReactNode }) {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [plottedDatasets, setPlottedDatasets] = useState<PlottedDataset[]>([]);

  const plotAllChannels = useCallback((dataset: PlottedDataset) => {
    setPlottedDatasets((prev) => {
      const exists = prev.some((d) => d.datasetId === dataset.datasetId);
      if (exists) return prev;
      return [...prev, dataset];
    });
  }, []);

  const removePlottedDataset = useCallback((datasetId: string) => {
    setPlottedDatasets((prev) => prev.filter((d) => d.datasetId !== datasetId));
  }, []);

  return (
    <PlaygroundContext.Provider
      value={{
        selectedExperimentId,
        setSelectedExperimentId,
        plottedDatasets,
        plotAllChannels,
        removePlottedDataset,
      }}
    >
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
