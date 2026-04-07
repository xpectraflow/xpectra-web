"use client";

import React, { useState, useEffect } from "react";
import { ExcelTable } from "@/components/ui/excel-style-table";
import { Check, AlertCircle, Clock, Hash, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelInfo {
  sensorId: string;
  sensorName: string;
  channelIndex: number; // 0-based index within the sensor
  experimentChannelIndex: number; // 1-based experiment-wide index
}

interface DataMapperProps {
  headers: string[];
  rows: string[][];
  availableChannels: ChannelInfo[];
  onMappingChange: (mapping: MappingState) => void;
}

export interface MappingState {
  timestampColumn: string | null;
  channelMappings: Record<number, string | null>; // experimentChannelIndex -> columnHeader
}

export const DataMapper: React.FC<DataMapperProps> = ({
  headers,
  rows,
  availableChannels,
  onMappingChange,
}) => {
  const [mapping, setMapping] = useState<MappingState>({
    timestampColumn: null,
    channelMappings: {},
  });

  // Auto-map based on header names
  useEffect(() => {
    const newMapping: MappingState = {
      timestampColumn: null,
      channelMappings: {},
    };

    // Try to find timestamp
    const tsHeader = headers.find(h =>
      /time|date|ts|timestamp|clock/i.test(h)
    );
    if (tsHeader) newMapping.timestampColumn = tsHeader;

    // Get non-timestamp headers for data mapping
    const dataHeaders = headers.filter(h => h !== tsHeader);

    console.log("Auto-mapping check:", {
      totalHeaders: headers.length,
      timestampColumn: tsHeader,
      dataHeadersCount: dataHeaders.length,
      availableChannelsCount: availableChannels.length
    });

    // If data column count matches channel count, do sequential mapping
    if (dataHeaders.length === availableChannels.length) {
      availableChannels.forEach((ch, idx) => {
        newMapping.channelMappings[ch.experimentChannelIndex] = dataHeaders[idx];
      });
      console.log("Sequential mapping applied.");
    } else {
      // Otherwise set all to null/ignore as requested
      availableChannels.forEach(ch => {
        newMapping.channelMappings[ch.experimentChannelIndex] = null;
      });
      console.log("Column mismatch. Setting channels to 'Ignore'.");
    }

    setMapping(newMapping);
  }, [headers, availableChannels]);

  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  const handleTimestampChange = (col: string) => {
    setMapping(prev => ({ ...prev, timestampColumn: col }));
  };

  const handleChannelMappingChange = (expIdx: number, col: string | null) => {
    setMapping(prev => ({
      ...prev,
      channelMappings: { ...prev.channelMappings, [expIdx]: col },
    }));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapping Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground underline decoration-primary/30 underline-offset-4">Time Alignment</h3>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Select Timestamp Column</label>
              <select
                value={mapping.timestampColumn || ""}
                onChange={(e) => handleTimestampChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none"
              >
                <option value="" disabled>Choose column...</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {!mapping.timestampColumn && (
                <p className="text-[10px] text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Timestamp is required
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground underline decoration-primary/30 underline-offset-4">Channel Mapping</h3>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {availableChannels.map((ch) => (
                <div key={ch.experimentChannelIndex} className="space-y-1.5 pb-3 border-b border-border/50 last:border-0">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-foreground">
                      Ch {ch.experimentChannelIndex} <span className="text-muted-foreground font-normal">({ch.sensorName})</span>
                    </span>
                    {mapping.channelMappings[ch.experimentChannelIndex] && (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <select
                    value={mapping.channelMappings[ch.experimentChannelIndex] || ""}
                    onChange={(e) => handleChannelMappingChange(ch.experimentChannelIndex, e.target.value || null)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none transition-colors border-dashed"
                  >
                    <option value="">(Ignore)</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <ExcelTable
              data={rows}
              headers={headers}
              title="Data Preview"
              className="border-0 shadow-none rounded-none"
            />
          </div>

          <div className="bg-primary/5 rounded-lg border border-primary/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary/20 p-1">
                <AlertCircle className="h-3 w-3 text-primary" />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-semibold text-primary">Mapping Logic</p>
                <p className="text-muted-foreground leading-relaxed">
                  We'll extract values from the selected columns and store them in the database. Ensure units (e.g., V, Pa, °C) match your sensor configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
