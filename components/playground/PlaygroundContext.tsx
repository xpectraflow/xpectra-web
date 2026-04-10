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

type PlaygroundContextValue = {
  selectedExperimentId: string | null;
  setSelectedExperimentId: (id: string) => void;

  /** Plots current shown in the playground canvas */
  plottedDatasets: PlottedDataset[];
  addPlot: (dataset: Omit<PlottedDataset, "id">) => void;
  removePlot: (plotId: string) => void;
};

export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedExperimentId: null,
  setSelectedExperimentId: () => {},
  plottedDatasets: [],
  addPlot: () => {},
  removePlot: () => {},
});

export function usePlayground() {
  return useContext(PlaygroundContext);
}
