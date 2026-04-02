'use client';

import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { ExcelTable } from '@/components/ui/excel-style-table';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CreateSensorPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [Serialnumber, setSerialNumber] = useState('');
  const [channelCount, setChannelCount] = useState(1);
  const [calibratedAt, setCalibratedAt] = useState('');
  const [sensorSheetFile, setSensorSheetFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);

  const createSensor = trpc.sensors.createSensor.useMutation({
    onSuccess: () => {
      toast.success('Sensor created successfully');
      router.push('/sensors');
    },
    onError: (err) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const generateUploadUrl = trpc.sensors.generateUploadUrl.useMutation();

  // Re-initialize table when channelCount changes
  useEffect(() => {
    const cCount = Math.max(1, channelCount);
    const newHeaders = [
      'Name',
      ...Array(cCount).fill(0).map((_, i) => `Cal ${i + 1}`),
      ' ', // Spacer 1
      'Bias',
      'Min Value',
      'Max Value',
      'Fail Lo',
      'Fail Hi',
      'Unit'
    ];
    setHeaders(newHeaders);

    const newData: string[][] = [];
    for (let i = 0; i < cCount; i++) {
      const row = [];
      row.push(`Channel ${i + 1}`); // Name
      for (let j = 0; j < cCount; j++) {
        row.push(i === j ? "1" : "0"); // Identity matrix
      }
      row.push(""); // Spacer 1
      row.push("0"); // Bias
      row.push(null); // Min value
      row.push(null); // Max value
      row.push(null); // Fail Lo
      row.push(null); // Fail Hi
      row.push("-"); // Unit string indicator (Volts)
      newData.push(row);
    }
    setData(newData);
  }, [channelCount]);

  const handleCellChange = (row: number, col: number, value: string) => {
    const newData = [...data];
    newData[row][col] = value;
    setData(newData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channelCount !== data.length) return;

    if (!name) {
      toast.error('Sensor name is required');
      return;
    }

    const calibrationMatrix: number[][] = [];
    const bias: number[] = [];
    const channels = [];

    const cCount = channelCount;
    // headers order: [Name, Cal 1..N, ' ', Bias, Min Value, Max Value, Fail Lo, Fail Hi, Unit]
    const spacer1Col = 1 + cCount;
    const biasCol = spacer1Col + 1;
    const minValCol = biasCol + 1;
    const maxValCol = minValCol + 1;
    const failLoCol = maxValCol + 1;
    const failHiCol = failLoCol + 1;
    const unitCol = failHiCol + 1;

    try {
      for (let i = 0; i < cCount; i++) {
        const rowData = data[i];

        const parseNum = (val: string) => val === '' ? null : parseFloat(val);

        // Channels array
        channels.push({
          channelIndex: i,
          name: rowData[0], // Name col
          minValue: parseNum(rowData[minValCol]),
          maxValue: parseNum(rowData[maxValCol]),
          failureThresholdLo: parseNum(rowData[failLoCol]),
          failureThresholdHi: parseNum(rowData[failHiCol]),
          unit: rowData[unitCol],
        });

        // Calibration row
        const calRow = [];
        for (let j = 1; j <= cCount; j++) {
          calRow.push(parseFloat(rowData[j]) || 0);
        }
        calibrationMatrix.push(calRow);

        // Bias element
        bias.push(parseFloat(rowData[biasCol]) || 0);
      }

      let finalFileUrl: string | undefined = undefined;

      if (sensorSheetFile) {
        setIsUploading(true);
        const { presignedUrl, publicUrl } = await generateUploadUrl.mutateAsync({
          filename: sensorSheetFile.name,
          contentType: sensorSheetFile.type,
        });

        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: sensorSheetFile,
          headers: {
            'Content-Type': sensorSheetFile.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload sensor sheet PDF');
        }

        finalFileUrl = publicUrl;
      }

      createSensor.mutate({
        name,
        description: description || undefined,
        serialNumber: Serialnumber || undefined,
        calibratedAt: calibratedAt ? new Date(calibratedAt) : undefined,
        sensorSheetUrl: finalFileUrl,
        channelCount: cCount,
        calibrationMatrix,
        bias,
        channels,
      });
    } catch (e: any) {
      toast.error(e.message || 'Could not parse table contents. Please ensure numeric fields contain valid numbers.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageLayout
      title="Create Sensor"
      description="Define a new sensor and its channels"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sensor Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
              placeholder="e.g. My Custom Sensor"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Serial Number</label>
            <input
              value={Serialnumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
              placeholder="Optional SN"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm font-medium">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
              placeholder="Description"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Sensor PDF</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSensorSheetFile(file);
                }
              }}
              className="w-full cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-1 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90 focus:outline-none"
            />
            {sensorSheetFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {sensorSheetFile.name}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Calibrated At</label>
            <input
              type="datetime-local"
              value={calibratedAt}
              onChange={(e) => setCalibratedAt(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Channel Count (N)</label>
            <input
              required
              type="number"
              min="1"
              max="20"
              value={channelCount}
              onChange={(e) => setChannelCount(parseInt(e.target.value) || 1)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border mt-6">
          <ExcelTable
            data={data}
            headers={headers}
            editable={true}
            onCellChange={handleCellChange}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={createSensor.isPending || isUploading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {createSensor.isPending || isUploading ? 'Creating...' : 'Create Sensor'}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}
