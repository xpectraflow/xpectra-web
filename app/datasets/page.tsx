'use client';

import { PageLayout } from '@/components/PageLayout';
import { Plus, Search } from 'lucide-react';
import { useDevices } from '@/contexts/DeviceContext';

const staticDataset = {
  group: 'Personal Datasets',
  name: 'arush kumar singh',
  temporalCoverage: '—',
  datapoints: 0,
};

export default function DatasetsPage() {
  const { devices } = useDevices();

  // Build table rows: show static row if no devices, otherwise show devices
  const tableRows =
    devices.length === 0
      ? [staticDataset]
      : devices.map((device) => ({
          group: 'Personal Datasets',
          name: device.name,
          temporalCoverage: '—',
          datapoints: 0,
        }));

  return (
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
              {tableRows.map((dataset, index) => (
                <tr
                  key={index}
                  className="transition-colors hover:bg-gray-900/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {dataset.group}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">
                    {dataset.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {dataset.temporalCoverage}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {dataset.datapoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
