import { useMemo, useEffect, RefObject } from "react";
import { trpc } from "@/lib/trpc";
import { usePlaygroundTimeStore } from "@/stores/playgroundTime";
import { PlottedChannelGroup, VirtualChannel } from "@/components/playground/PlaygroundContext";

export const getGlobalId = (datasetId: string, channelId: string) => `${datasetId}:${channelId}`;

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
          console.warn("Circular dependency detected for VC:", vcId);
          return;
        }

        resolving.add(vcId);
        const vc = datasetVirtuals.find(v => v.id === vcId);
        if (vc) {
          const rawTokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
          rawTokens.forEach(token => {
            const physical = allChannels.find(c => c.name === token || `${c.sensorName}.${c.name}` === token);
            if (physical) {
              neededPhysicalIds.add(physical.id);
            } else {
              const nestedVC = datasetVirtuals.find(v => v.name === token);
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
      return {
        ...t.telemetry.getChannelData({
          experimentId: rg.experimentId,
          datasetId: rg.datasetId,
          channelIds: rg.neededPhysicalIds,
          startTime: startTime ?? 0,
          endTime: endTime ?? Date.now(),
        }),
        enabled: startTime !== null && endTime !== null && isInView && timeRanges[idx].status === "success",
      };
    })
  );

  // Primary dataset (first one) provides initial duration if none set
  useEffect(() => {
    const firstRange = timeRanges[0]?.data;
    if (firstRange?.startTime && firstRange?.endTime && startTime === null) {
      initTimeRange(firstRange.startTime, firstRange.endTime);
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

      // Add physical channels
      res.series.filter((s: any) => rg.plottingPhysicals.includes(s.channelId)).forEach((s: any) => {
        const fallbackName = s.sensorName ? `${s.sensorName}.${s.channelName}` : s.channelName;
        combined.push({
          ...s,
          points: s.points.map((p: any) => ({ ...p, t: p.t - baseTime })),
          globalId: getGlobalId(rg.datasetId, s.channelId),
          displayName: labelMap?.[getGlobalId(rg.datasetId, s.channelId)] ?? fallbackName
        });
      });

      // Evaluate virtual channels
      const valMap = new Map<string, any>();
      res.series.forEach((s: any) => {
        valMap.set(s.channelName, s);
        valMap.set(`${s.sensorName}.${s.channelName}`, s);
      });

      const samplesCount = res.series[0]?.points.length ?? 0;
      
      rg.orderedVirtuals.forEach(vc => {
        const rawTokens = vc.expression.match(/[a-zA-Z0-9_\.]+/g) || [];
        const tokens = Array.from(new Set(rawTokens)).sort((a, b) => b.length - a.length);
        const virtualPoints: any[] = [];
        
        if (samplesCount > 0) {
          for (let i = 0; i < samplesCount; i++) {
            let expr = vc.expression.replace(/@/g, "");
            tokens.forEach((t: string) => {
              const s = valMap.get(t);
              const val = s?.points[i]?.avg ?? 0;
              const escapedT = t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
              expr = expr.replace(new RegExp(`(?<![a-zA-Z0-9_.])` + escapedT + `(?![a-zA-Z0-9_.])`, "g"), val.toString());
            });
            
            try {
              // eslint-disable-next-line no-eval
              const result = eval(expr);
              virtualPoints.push({
                t: res.series[0].points[i].t,
                avg: result, min: result, max: result
              });
            } catch {
              virtualPoints.push({ t: res.series[0].points[i].t, avg: 0, min: 0, max: 0 });
            }
          }
        }

        const vcSeries = {
          channelId: vc.id,
          channelName: vc.name,
          globalId: getGlobalId(rg.datasetId, vc.id),
          points: virtualPoints.map((p: any) => ({ ...p, t: p.t - baseTime })), // Normalize time
          unit: "Derived",
          displayName: labelMap?.[getGlobalId(rg.datasetId, vc.id)] ?? vc.name
        };

        valMap.set(vc.name, { ...vcSeries, points: virtualPoints });
        
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
