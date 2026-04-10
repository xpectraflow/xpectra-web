/**
 * Zustand store for playground-wide zoom/time-range synchronization.
 *
 * Any chart that updates the time range will cause all other charts
 * to re-fetch and re-render to the same viewport — the Bloomberg Terminal model.
 */
import { create } from "zustand";

interface PlaygroundTimeStore {
  /** The current visible time window — epoch ms */
  startTime: number | null;
  endTime: number | null;

  /** Whether all charts should be linked (zoom sync on) */
  linked: boolean;

  /** Set a new time window — triggers re-fetch in all linked charts */
  setTimeRange: (start: number, end: number) => void;

  /** Toggle sync link */
  toggleLinked: () => void;

  /** Initialize from a dataset's full time range */
  initTimeRange: (start: number, end: number) => void;
}

export const usePlaygroundTimeStore = create<PlaygroundTimeStore>((set) => ({
  startTime: null,
  endTime: null,
  linked: true,

  setTimeRange: (start, end) =>
    set({ startTime: start, endTime: end }),

  toggleLinked: () =>
    set((s) => ({ linked: !s.linked })),

  initTimeRange: (start, end) =>
    set((s) => {
      // Only init if not already set
      if (s.startTime !== null) return s;
      return { startTime: start, endTime: end };
    }),
}));
