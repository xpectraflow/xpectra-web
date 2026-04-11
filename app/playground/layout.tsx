"use client";

import { ReactNode, useState, useCallback } from "react";
import { SessionProvider } from "next-auth/react";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { DeviceProvider } from "@/contexts/DeviceContext";
import { PlaygroundSidebar } from "@/components/playground/PlaygroundSidebar";
import { PlaygroundContext, PlottedDataset, VirtualChannel, PlottedChannelGroup } from "@/components/playground/PlaygroundContext";

function PlaygroundShell({ children }: { children: ReactNode }) {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [plottedDatasets, setPlottedDatasets] = useState<PlottedDataset[]>([]);
  const [virtualChannels, setVirtualChannels] = useState<VirtualChannel[]>([]);

  const addVirtualChannel = useCallback((vc: Omit<VirtualChannel, "id">) => {
    setVirtualChannels((prev) => [
      ...prev,
      { ...vc, id: "vc_" + crypto.randomUUID() },
    ]);
  }, []);

  const removeVirtualChannel = useCallback((vcId: string) => {
    setVirtualChannels((prev) => prev.filter((v) => v.id !== vcId));
  }, []);

  const addPlot = useCallback((newPlot: Omit<PlottedDataset, "id">) => {
    setPlottedDatasets((prev) => {
      // Check if duplicate block with same groups exists
      const isDuplicate = prev.some((d) => 
        d.layout === newPlot.layout && 
        JSON.stringify(d.groups) === JSON.stringify(newPlot.groups)
      );
      if (isDuplicate) return prev;

      const plotWithId: PlottedDataset = {
        ...newPlot,
        id: crypto.randomUUID(),
      };
      return [...prev, plotWithId];
    });
  }, []);

  const addToPlot = useCallback((plotId: string, group: PlottedChannelGroup) => {
    setPlottedDatasets((prev) => prev.map(plot => {
      if (plot.id !== plotId) return plot;
      
      // Check if dataset already in this plot
      const existingGroup = plot.groups.find(g => g.datasetId === group.datasetId);
      if (existingGroup) {
        return {
          ...plot,
          groups: plot.groups.map(g => g.datasetId === group.datasetId 
            ? { ...g, channelIds: Array.from(new Set([...g.channelIds, ...group.channelIds])) }
            : g
          )
        };
      } else {
        return {
          ...plot,
          groups: [...plot.groups, group]
        };
      }
    }));
  }, []);

  const removePlot = useCallback((plotId: string) => {
    setPlottedDatasets((prev) => prev.filter((d) => d.id !== plotId));
  }, []);

  return (
    <PlaygroundContext.Provider
      value={{
        selectedExperimentId,
        setSelectedExperimentId,
        plottedDatasets,
        addPlot,
        addToPlot,
        removePlot,
        virtualChannels,
        addVirtualChannel,
        removeVirtualChannel,
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
