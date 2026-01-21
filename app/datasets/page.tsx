'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Plus, Search } from 'lucide-react';
import { useDevices, Device } from '@/contexts/DeviceContext';
import { DeviceDetailsDrawer } from '@/components/DeviceDetailsDrawer';

const staticDataset = {
  group: 'Personal Datasets',
  name: 'arush kumar singh',
  temporalCoverage: '—',
  datapoints: 0,
  source: 'Internal',
};

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
    return 'bg-blue-900/30 text-blue-300';
  }
  if (sourceLower.includes('cpcb')) {
    return 'bg-purple-900/30 text-purple-300';
  }
  return 'bg-gray-800 text-gray-300';
};

export default function DatasetsPage() {
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Build table rows: show static row if no devices, otherwise show devices
  const tableRows =
    devices.length === 0
      ? [{ ...staticDataset, id: 'static', isStatic: true }]
      : devices.map((device) => ({
          id: device.id,
          group: 'Personal Datasets',
          name: device.name,
          temporalCoverage: '—',
          datapoints: 0,
          source: device.source || 'Internal',
          device: device,
          isStatic: false,
        }));

  const handleRowClick = (row: any) => {
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
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Create dataset
          </button>
        }
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search datasets..."
              className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2 pl-10 pr-3 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-gray-800">
            <table className="w-full">
              <thead className="border-b border-gray-800 bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Group
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Temporal Coverage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Datapoints
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tableRows.map((row, index) => {
                  const device = row.device as Device | undefined;
                  const isHovered = hoveredRow === index;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`relative transition-colors ${
                        !row.isStatic
                          ? 'cursor-pointer hover:bg-gray-900/50'
                          : 'hover:bg-gray-900/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {row.group}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{row.name}</span>
                          {device && (
                            <>
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                  device.status === 'Active'
                                    ? 'bg-green-900/30 text-green-300'
                                    : device.status === 'Inactive'
                                    ? 'bg-red-900/30 text-red-300'
                                    : 'bg-gray-800 text-gray-300'
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
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {row.temporalCoverage}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {row.datapoints}
                      </td>

                      {/* Hover Schema Preview Tooltip */}
                      {isHovered && device && (
                        <div className="absolute right-0 top-0 z-50 mr-2 w-64 rounded-lg border border-gray-800 bg-gray-900 p-4 shadow-xl">
                          <div className="space-y-2 text-sm">
                            <div className="font-semibold text-white">
                              Schema Preview
                            </div>
                            <div>
                              <div className="font-medium text-gray-400">
                                Signals:
                              </div>
                              <div className="mt-1 space-y-1 text-gray-300">
                                {device.measuredSignals &&
                                device.measuredSignals.length > 0 ? (
                                  device.measuredSignals
                                    .slice(0, 3)
                                    .map((signal) => (
                                      <div key={signal}>
                                        • {signal} {getSignalUnit(signal)}
                                      </div>
                                    ))
                                ) : (
                                  <div className="text-gray-500">No signals</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-400">
                                Frequency:
                              </div>
                              <div className="mt-1 text-gray-300">
                                {device.dataFrequency}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-400">
                                Format:
                              </div>
                              <div className="mt-1 text-gray-300">
                                {device.dataFormat}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </tr>
                  );
                })}
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
