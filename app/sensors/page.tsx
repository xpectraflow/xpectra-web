'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Plus, Search, Edit2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';

export default function SensorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const { data: sensors, isLoading } = trpc.sensors.getSensors.useQuery();

  const filteredSensors = sensors?.filter((sensor) =>
    sensor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sensor.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <PageLayout
      title="Sensors"
      description="Manage and view your sensor configurations"
      action={
        <Link 
          href="/sensors/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create sensor
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sensors by name or serial number..."
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Serial Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Channels
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Calibrated At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading sensors...
                  </td>
                </tr>
              ) : filteredSensors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No sensors found. Click 'Create sensor' to add one.
                  </td>
                </tr>
              ) : (
                filteredSensors.map((sensor) => (
                  <tr
                    key={sensor.id}
                    onMouseEnter={() => setHoveredRow(sensor.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="relative transition-colors hover:bg-card/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{sensor.name}</span>
                        {sensor.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-xs">{sensor.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sensor.serialNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sensor.channelCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sensor.calibratedAt ? new Date(sensor.calibratedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
                        <Edit2 className="h-3.5 w-3.5" /> 
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
