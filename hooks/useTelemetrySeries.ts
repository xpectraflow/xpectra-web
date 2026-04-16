import { useMemo, useEffect, RefObject } from "react";
import { trpc } from "@/lib/trpc";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";
import { PlottedChannelGroup, VirtualChannel } from "@/components/playground/PlaygroundContext";

export const getGlobalId = (datasetId: string, channelId: string) => `${datasetId}:${channelId}`;

const normalize = (s: string) => s.toLowerCase().replace(/[\s\-_]/g, "");

interface UseTelemetrySeriesParams {
  groups: PlottedChannelGroup[];
  virtualChannels: VirtualChannel[];
  labelMap?: Record<string, string>;
  isInView: boolean;
  onRefetchData?: (queriesReady: boolean) => void;
}

export function useTelemetrySeries({
  groups,
  virtualChannels,
  labelMap,
  isInView,
}: UseTelemetrySeriesParams) {
  const { startTime, endTime } = usePlaygroundTimeStore();
  const { initTimeRange } = usePlaygroundTimeStore();

  // 1. Fetch channel metadata for each group
  const metaQueries = trpc.useQueries((t) =>
    groups.map((g) =>
      t.channels.getChannels({
        experimentId: g.experimentId,
        datasetId: g.datasetId,
      })
    )
  );

  // 1.5 Fetch time ranges for ALL datasets to establish baselines
  const timeRanges = trpc.useQueries((t) =>
    groups.map((g) =>
      t.telemetry.getDatasetTimeRange({
        experimentId: g.experimentId,
        datasetId: g.datasetId,
      })
    )
  );

  // 2. Determine exactly which physical channels we need to fetch
  const resolvedGroups = useMemo(() => {
    return groups.map((g, idx) => {
      const allChannels = metaQueries[idx].data ?? [];
      const isPlotAll = !g.channelIds || g.channelIds.length === 0;
      
      const datasetVirtuals = virtualChannels.filter(vc => vc.datasetId === g.datasetId);
      const plottingVirtualIds = new Set(g.channelIds.filter(id => id.startsWith("vc_")));
      
      if (isPlotAll) {
         datasetVirtuals.forEach(vc => plottingVirtualIds.add(vc.id));
      }

      const neededPhysicalIds = new Set<string>();
      const resolvedVirtuals: VirtualChannel[] = [];
      const visited = new Set<string>();
      const resolving = new Set<string>();

      const trace = (vcId: string) => {
        if (visited.has(vcId)) return;
        if (resolving.has(vcId)) {
          console.warn("[VC Trace] Circular dependency detected:", vcId);
          return;
        }

        resolving.add(vcId);
        const vc = datasetVirtuals.find(v => v.id === vcId);
        if (vc) {
          const rawTokens = vc.expression.match(/[a-zA-Z0-9_\.\-]+/g) || [];
          rawTokens.forEach(token => {
            const tokenNorm = normalize(token);
            const physical = allChannels.find(c => {
              const fullMatch = normalize(`${c.sensorName || ""}.${c.name}`);
              const nameMatch = normalize(c.name);
              return fullMatch === tokenNorm || nameMatch === tokenNorm;
            });

            if (physical) {
              neededPhysicalIds.add(physical.id);
            } else {
              const nestedVC = datasetVirtuals.find(v => normalize(v.name) === tokenNorm);
              if (nestedVC) {
                trace(nestedVC.id);
              }
            }
          });
          resolvedVirtuals.push(vc);
        }
        resolving.delete(vcId);
        visited.add(vcId);
      };

      plottingVirtualIds.forEach(id => trace(id));

      const plottingPhysicals = isPlotAll 
        ? allChannels.map(c => c.id)
        : g.channelIds.filter(id => !id.startsWith("vc_"));
      
      plottingPhysicals.forEach(id => neededPhysicalIds.add(id));

      return {
        ...g,
        plottingVirtuals: datasetVirtuals.filter(vc => plottingVirtualIds.has(vc.id)),
        orderedVirtuals: resolvedVirtuals,
        plottingPhysicals,
        neededPhysicalIds: Array.from(neededPhysicalIds),
        meta: allChannels,
      };
    });
  }, [groups, metaQueries, virtualChannels]);

  // 3. Multi-dataset telemetry fetch
  const dataQueries = trpc.useQueries((t) =>
    resolvedGroups.map((rg, idx) => {
      const baseTime = timeRanges[idx].data?.startTime ?? 0;
      return {
        ...t.telemetry.getChannelData({
          experimentId: rg.experimentId,
          datasetId: rg.datasetId,
          channelIds: rg.neededPhysicalIds,
          startTime: (startTime ?? 0) + baseTime,
          endTime: (endTime ?? 0) + baseTime,
        }),
        enabled: startTime !== null && 
                 endTime !== null && 
                 isInView && 
                 timeRanges[idx].status === "success" &&
                 rg.neededPhysicalIds.length > 0,
      };
    })
  );

  // Primary dataset (first one) provides initial duration if none set
  useEffect(() => {
    const firstRange = timeRanges[0]?.data;
    if (firstRange?.startTime && firstRange?.endTime && startTime === null) {
      const duration = firstRange.endTime - firstRange.startTime;
      initTimeRange(0, duration);
    }
  }, [timeRanges, initTimeRange, startTime]);

  // Merge results into a unified series list
  const allSeries = useMemo(() => {
    const combined: any[] = [];
    resolvedGroups.forEach((rg, idx) => {
      const query = dataQueries[idx];
      const metadata = timeRanges[idx].data;
      if (!query.data || !metadata) return;

      const baseTime = metadata.startTime ?? 0;
      const res = query.data;

      // 4. Create a map for easy lookup during evaluation
      // Enrich series with sensorName from physical metadata
      const enrichedSeries = res.series.map((s: any) => {
        const m = rg.meta.find(meta => meta.id === s.channelId);
        return { ...s, sensorName: m?.sensorName ?? "" };
      });

      // Add physical channels
      enrichedSeries.filter((s: any) => rg.plottingPhysicals.includes(s.channelId)).forEach((s: any) => {
        const fallbackName = s.sensorName ? `${s.sensorName}.${s.channelName}` : s.channelName;
        combined.push({
          ...s,
          points: s.points.map((p: any) => ({ ...p, t: p.t - baseTime })),
          globalId: getGlobalId(rg.datasetId, s.channelId),
          displayName: labelMap?.[getGlobalId(rg.datasetId, s.channelId)] ?? fallbackName
        });
      });

      // Evaluate virtual channels
      const samplesCount = enrichedSeries[0]?.points.length ?? 0;
      
      rg.orderedVirtuals.forEach(vc => {
        const rawTokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
        const tokens = Array.from(new Set(rawTokens)).sort((a, b) => b.length - a.length);
        const virtualPoints: any[] = [];
        
        if (samplesCount > 0) {
          for (let i = 0; i < samplesCount; i++) {
            let expr = vc.expression.replace(/@/g, "");
            tokens.forEach((t: string) => {
              const tNorm = normalize(t);
              const s = enrichedSeries.find((series: any) => {
                const fullMatch = normalize(`${series.sensorName || ""}.${series.channelName}`);
                const nameMatch = normalize(series.channelName);
                return fullMatch === tNorm || nameMatch === tNorm;
              });
              
              const val = s?.points[i]?.avg ?? 0;
              const escapedT = t.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
              expr = expr.replace(new RegExp(`(?<![a-zA-Z0-9_.])` + escapedT + `(?![a-zA-Z0-9_.])`, "gi"), val.toString());
            });
            
            try {
              // eslint-disable-next-line no-eval
              const result = eval(expr);
              virtualPoints.push({
                t: enrichedSeries[0].points[i].t,
                avg: result, min: result, max: result
              });
            } catch {
              virtualPoints.push({ t: enrichedSeries[0].points[i].t, avg: 0, min: 0, max: 0 });
            }
          }
        }

        const vcSeries = {
          channelId: vc.id,
          channelName: vc.name, // Allow matching by name in nested VCs
          sensorName: "",       // VC names are global within the dataset group
          globalId: getGlobalId(rg.datasetId, vc.id),
          points: virtualPoints.map((p: any) => ({ ...p, t: p.t - baseTime })), 
          unit: "Derived",
          displayName: labelMap?.[getGlobalId(rg.datasetId, vc.id)] ?? vc.name
        };

        // Important: Add to enrichedSeries so nested VCs can find this result
        enrichedSeries.push({
          ...vcSeries,
          points: virtualPoints // Keep raw time for internal matching
        });

        if (rg.plottingVirtuals.some(pv => pv.id === vc.id)) {
          combined.push(vcSeries);
        }
      });
    });
    return combined;
  }, [dataQueries, resolvedGroups, labelMap, timeRanges]);

  return {
    allSeries,
    isLoading: dataQueries.some(q => q.isLoading) || timeRanges.some(q => q.isLoading),
    primaryBaseTime: timeRanges[0]?.data?.startTime ?? 0,
  };
}
