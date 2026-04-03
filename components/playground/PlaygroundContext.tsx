import { createContext, useContext } from "react";

type PlaygroundContextValue = {
  selectedExperimentId: string | null;
  setSelectedExperimentId: (id: string) => void;
};

export const PlaygroundContext = createContext<PlaygroundContextValue>({
  selectedExperimentId: null,
  setSelectedExperimentId: () => {},
});

export function usePlayground() {
  return useContext(PlaygroundContext);
}
