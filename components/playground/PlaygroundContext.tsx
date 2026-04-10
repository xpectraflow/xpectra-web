import { createContext, useContext } from "react";

export type PlottedDataset = {
  /** Unique ID for this specific plot block on the canvas */
  id: string;
  datasetId: string;
  datasetName: string;
  experimentId: string;
  /** Whether to show each channel in its own panel or all together */
  layout: "separate" | "overlay";
  /** Optional subset of channel IDs to plot. If missing, plots all. */
  channelIds?: string[];
};

export type VirtualChannel = {
  id: string;
  datasetId: string;
  experimentId: string;
  name: string;
  expression: string;
};

type PlaygroundContextValue = {
  selectedExperimentId: string | null;
  setSelectedExperimentId: (id: string) => void;

  /** Plots current shown in the playground canvas */
  plottedDatasets: PlottedDataset[];
  addPlot: (dataset: Omit<PlottedDataset, "id">) => void;
  removePlot: (plotId: string) => void;

  virtualChannels: VirtualChannel[];
  addVirtualChannel: (vc: Omit<VirtualChannel, "id">) => void;
  removeVirtualChannel: (vcId: string) => void;
};

export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedExperimentId: null,
  setSelectedExperimentId: () => {},
  plottedDatasets: [],
  addPlot: () => {},
  removePlot: () => {},
  virtualChannels: [],
  addVirtualChannel: () => {},
  removeVirtualChannel: () => {},
});

export function usePlayground() {
  return useContext(PlaygroundContext);
}
