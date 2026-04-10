import { createContext, useContext } from "react";

export type PlottedDataset = {
  datasetId: string;
  datasetName: string;
  experimentId: string;
  /** Optional subset of channel IDs to plot. If missing, plots all. */
  channelIds?: string[];
};

type PlaygroundContextValue = {
  selectedExperimentId: string | null;
  setSelectedExperimentId: (id: string) => void;

  /** Datasets whose channels are plotted in the canvas */
  plottedDatasets: PlottedDataset[];
  plotAllChannels: (dataset: PlottedDataset) => void;
  plotChannels: (dataset: PlottedDataset) => void;
  removePlottedDataset: (datasetId: string) => void;
};

export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedExperimentId: null,
  setSelectedExperimentId: () => {},
  plottedDatasets: [],
  plotAllChannels: () => {},
  removePlottedDataset: () => {},
});

export function usePlayground() {
  return useContext(PlaygroundContext);
}
