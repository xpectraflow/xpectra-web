'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { ExcelTable } from '@/components/ui/excel-style-table';
import { trpc } from '@/lib/trpc';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ViewSensorPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';

  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);

  const { data: sensor, isLoading } = trpc.sensors.getSensorById.useQuery(
    { id },
    { enabled: !!id }
  );

  useEffect(() => {
    if (!sensor) return;

    const cCount = sensor.channelCount;
    const newHeaders = [
      'Name',
      ...Array(cCount).fill(0).map((_, i) => `Cal ${i + 1}`),
      ' ', // Spacer 1
      'Bias',
      'Min Val',
      'Max Val',
      'Fail Lo',
      'Fail Hi',
      'Unit'
    ];
    setHeaders(newHeaders);

    const newData: string[][] = [];
    const calibrationMatrix = sensor.calibrationMatrix || [];
    const bias = sensor.bias || [];
    const channels = sensor.channels || [];

    for (let i = 0; i < cCount; i++) {
        const row = [];
        const ch = channels.find(c => c.channelIndex === i) || null;
        
        row.push(ch?.name || `Channel ${i + 1}`);

        // Cal
        for (let j = 0; j < cCount; j++) {
            const val = calibrationMatrix[i]?.[j];
            row.push(val !== undefined ? val.toString() : (i === j ? "1" : "0"));
        }

        row.push(""); // Spacer 1
        row.push(bias[i] !== undefined ? bias[i].toString() : "0"); // Bias
        row.push(ch?.minValue?.toString() || ""); // Min value
        row.push(ch?.maxValue?.toString() || ""); // Max value
        row.push(ch?.failureThresholdLo?.toString() || ""); // Fail Lo
        row.push(ch?.failureThresholdHi?.toString() || ""); // Fail Hi
        row.push(ch?.unit || "-"); // Unit string indicator (Volts)
        newData.push(row);
    }
    setData(newData);
  }, [sensor]);

  if (isLoading) {
    return <PageLayout title="Loading..."><div className="p-4 text-muted-foreground">Loading sensor data...</div></PageLayout>;
  }

  if (!sensor) {
    return <PageLayout title="Not Found"><div className="p-4 text-destructive">Sensor not found.</div></PageLayout>;
  }

  return (
    <PageLayout
      title={`Sensor: ${sensor.name}`}
      description={sensor.description || `Viewing properties for sensor ${sensor.name}`}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-6 rounded-lg border border-border">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Serial Number</span>
            <p className="text-sm font-medium">{sensor.serialNumber || '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calibrated At</span>
            <p className="text-sm font-medium">{sensor.calibratedAt ? new Date(sensor.calibratedAt).toLocaleString() : '—'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel Count</span>
            <p className="text-sm font-medium">{sensor.channelCount}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Sheet</span>
            {sensor.sensorSheetUrl ? (
              <a href={sensor.sensorSheetUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                View Document
              </a>
            ) : (
                <p className="text-sm font-medium text-muted-foreground">—</p>
            )}
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-base font-semibold mb-4">Calibration & Channels </h3>
          <div className="border border-border rounded-lg overflow-hidden">
             <ExcelTable 
               data={data}
               headers={headers}
               title="Calibration Metadata"
               editable={false}
               onCellChange={() => {}}
             />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Link 
             href={`/sensors/new?duplicate=${sensor.id}`}
             className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90"
          >
            Duplicate Sensor
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
