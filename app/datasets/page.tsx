'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Plus, Search } from 'lucide-react';
import { useDevices, Device } from '@/contexts/DeviceContext';
import { DeviceDetailsDrawer } from '@/components/DeviceDetailsDrawer';
import Link from "next/link";


const getSignalUnit = (signal: string): string => {
  const units: Record<string, string> = {
    Temperature: '°C',
    Humidity: '%',
    Pressure: 'hPa',
    'Wind Speed': 'm/s',
    'Wind Direction': '°',
    'PM2.5': 'µg/m³',
    PM10: 'µg/m³',
    'CO₂': 'ppm',
    Rainfall: 'mm',
  };
  return units[signal] || '';
};

const getSourceTag = (source?: string): string => {
  if (!source) return 'Internal';
  return source;
};

const getSourceTagColor = (source?: string): string => {
  const sourceLower = (source || 'Internal').toLowerCase();
  if (sourceLower.includes('isro')) {
    return 'bg-primary/20 text-primary';
  }
  if (sourceLower.includes('cpcb')) {
    return 'bg-purple-900/30 text-purple-300';
  }
  return 'bg-accent text-muted-foreground';
};

export default function DatasetsPage() {
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getActiveRulesCount = (datasetName: string): number => {
    const nameLower = datasetName.toLowerCase();
    if (nameLower.includes('mosdac')) return 2;
    if (nameLower.includes('aqi')) return 1;
    return 0;
  };

  // Build table rows: show static row if no devices, otherwise show devices
  type TableRow = {
    id: string;
    group: string;
    name: string;
    temporalCoverage: string;
    datapoints: number;
    source: string;
    isStatic: boolean;
    activeRules: number;
    device?: Device;
  };

  const tableRows: TableRow[] = devices.map((device) => ({
    id: device.id,
    group: 'Personal Datasets',
    name: device.name,
    temporalCoverage: '—',
    datapoints: 0,
    source: device.source || 'Internal',
    device: device,
    isStatic: false,
    activeRules: getActiveRulesCount(device.name),
  }));

  const filteredRows = tableRows.filter(
    (row) =>
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowClick = (row: TableRow) => {
    if (!row.isStatic && row.device) {
      setSelectedDevice(row.device);
      setIsDrawerOpen(true);
    }
  };

  return (
    <>
      <PageLayout
        title="My datasets"
        description="Manage and view your datasets"
        action={
          <Link
            href="/datasets/create"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create dataset
          </Link>
        }
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead className="border-b border-border bg-card/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Group
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Temporal Coverage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Datapoints
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Active Rules
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {devices.length === 0
                        ? "No datasets yet. Create a dataset through the client."
                        : "No datasets match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const device = row.device as Device | undefined;
                    const isHovered = hoveredRow === index;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row)}
                        onMouseEnter={() => setHoveredRow(index)}
                        onMouseLeave={() => setHoveredRow(null)}
                        className={`relative transition-colors ${!row.isStatic
                          ? 'cursor-pointer hover:bg-card/50'
                          : 'hover:bg-card/50'
                          }`}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.group}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{row.name}</span>
                            {device && (
                              <>
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${device.status === 'Active'
                                    ? 'bg-green-900/30 text-green-300'
                                    : device.status === 'Inactive'
                                      ? 'bg-destructive/20 text-destructive-foreground'
                                      : 'bg-accent text-muted-foreground'
                                    }`}
                                >
                                  {device.status}
                                </span>
                                <span
                                  className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getSourceTagColor(
                                    device.source
                                  )}`}
                                >
                                  {getSourceTag(device.source)}
                                </span>
                              </>
                            )}
                            {row.isStatic && (
                              <span
                                className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${getSourceTagColor(
                                  row.source
                                )}`}
                              >
                                {getSourceTag(row.source)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.temporalCoverage}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.datapoints}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {row.activeRules}
                        </td>

                        {/* Hover Schema Preview Tooltip */}
                        {isHovered && device && (
                          <div className="absolute right-0 top-0 z-50 mr-2 w-64 rounded-lg border border-border bg-card p-4 shadow-xl">
                            <div className="space-y-2 text-sm">
                              <div className="font-semibold text-foreground">
                                Schema Preview
                              </div>
                              <div>
                                <div className="font-medium text-muted-foreground">
                                  Signals:
                                </div>
                                <div className="mt-1 space-y-1 text-muted-foreground">
                                  {device.signalsEmitted &&
                                    device.signalsEmitted.length > 0 ? (
                                    device.signalsEmitted.slice(0, 3).map((signal) => (
                                      <div key={signal}>• {signal}</div>
                                    ))
                                  ) : device.measuredSignals &&
                                    device.measuredSignals.length > 0 ? (
                                    device.measuredSignals
                                      .slice(0, 3)
                                      .map((signal) => (
                                        <div key={signal}>
                                          • {signal} {getSignalUnit(signal)}
                                        </div>
                                      ))
                                  ) : (
                                    <div className="text-muted-foreground">No signals</div>
                                  )}
                                </div>
                              </div>
                              {device.primaryTimeAxis && (
                                <div>
                                  <div className="font-medium text-muted-foreground">
                                    Time Axis:
                                  </div>
                                  <div className="mt-1 text-muted-foreground">
                                    {device.primaryTimeAxis}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-muted-foreground">
                                  Frequency:
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                  {device.dataFrequency}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium text-muted-foreground">
                                  Format:
                                </div>
                                <div className="mt-1 text-muted-foreground">
                                  {device.dataFormat}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageLayout>

      <DeviceDetailsDrawer
        device={selectedDevice}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDevice(null);
        }}
      />
    </>
  );
}

