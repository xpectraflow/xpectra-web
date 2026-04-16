import { computeFFT } from "./fft";

self.onmessage = (e: MessageEvent) => {
  const { series, colorMap, uniqueUnits, requestId } = e.data;
  
  try {
    const results = series.flatMap((s: any) => {
      // Basic validation
      if (!s.points || s.points.length < 3) return [];
      
      const color = colorMap[s.globalId] || "#ccc";
      const yAxisIndex = s.unit ? Math.max(0, uniqueUnits.indexOf(s.unit)) : 0;
      
      // Calculate sample rate (assume uniform)
      // We need at least 2 points to get dt
      if (!s.points[0] || !s.points[1]) return [];
      
      const dtMs = Math.max(1, s.points[1].t - s.points[0].t);
      const f = computeFFT(s.points.map((p: any) => p.avg), dtMs);
      
      return [{
        name: s.displayName + " (FFT)",
        type: "line",
        data: f.freq.map((freq: any, i: number) => [freq, f.mag[i]]),
        lineStyle: { color, width: 1.5 },
        itemStyle: { color },
        showSymbol: false,
        yAxisIndex,
        z: 2,
      }];
    });

    self.postMessage({ results, requestId });
  } catch (err) {
    console.error("[FFT Worker Error]", err);
    self.postMessage({ results: [], requestId, error: String(err) });
  }
};
