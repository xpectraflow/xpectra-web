'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

type OpenDataset = {
  id: string;
  name: string;
  source: string;
  sensorType: string;
  signals: string[];
  coverage: string;
  temporalResolution: string;
  spatialResolution: string;
  useCases: string[];
  tags: { label: string; color: string }[];
};

const OPEN_DATASETS: OpenDataset[] = [
  {
    id: 'mosdac',
    name: 'MOSDAC Satellite Data',
    source: 'ISRO / MOSDAC',
    sensorType: 'Satellite (INSAT, SCATSAT)',
    signals: ['Cloud cover', 'Rainfall', 'Wind vectors', 'Sea surface temperature'],
    coverage: 'Indian subcontinent & Indian Ocean',
    temporalResolution: '15 min – 3 hr',
    spatialResolution: '4–25 km',
    useCases: ['Weather modeling', 'Energy forecasting', 'Disaster monitoring'],
    tags: [
      { label: 'Satellite', color: 'bg-primary/20 text-primary' },
      { label: 'Environmental', color: 'bg-green-900/30 text-green-300' },
      { label: 'ISRO', color: 'bg-primary/20 text-primary' },
    ],
  },
  {
    id: 'aqi',
    name: 'National Air Quality Index (AQI)',
    source: 'Central Pollution Control Board (CPCB)',
    sensorType: 'Fixed ground monitoring stations',
    signals: ['PM2.5', 'PM10', 'NO₂', 'SO₂', 'CO', 'O₃'],
    coverage: 'Major Indian cities',
    temporalResolution: 'Hourly',
    spatialResolution: 'Station-level',
    useCases: ['Urban analytics', 'Health risk modeling', 'Policy & compliance'],
    tags: [
      { label: 'Ground Sensors', color: 'bg-purple-900/30 text-purple-300' },
      { label: 'Urban', color: 'bg-orange-900/30 text-orange-300' },
      { label: 'CPCB', color: 'bg-purple-900/30 text-purple-300' },
    ],
  },
];

export default function OpenDataPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = OPEN_DATASETS.filter(
    (ds) =>
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.signals.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ds.tags.some((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageLayout
      title="Open Data"
      description="Public sensor datasets commonly used by geospatial and climate teams."
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, source, or signal..."
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
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Signals
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Coverage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Resolution
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tags
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {OPEN_DATASETS.length === 0
                      ? 'No open datasets available.'
                      : 'No datasets match your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((ds) => {
                  const isExpanded = expandedId === ds.id;
                  return (
                    <>
                      <tr
                        key={ds.id}
                        className="transition-colors hover:bg-card/50 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : ds.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{ds.name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{ds.source}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {ds.signals.slice(0, 3).join(' · ')}
                          {ds.signals.length > 3 && (
                            <span className="text-xs text-muted-foreground/60"> +{ds.signals.length - 3} more</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{ds.coverage}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <div>{ds.temporalResolution}</div>
                          <div className="text-xs text-muted-foreground/60">{ds.spatialResolution}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {ds.tags.map((tag) => (
                              <span
                                key={tag.label}
                                className={`rounded-md px-2 py-0.5 text-xs font-medium ${tag.color}`}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${ds.id}-expanded`} className="bg-muted/20">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-3 gap-6 text-sm">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Sensor Type</p>
                                <p className="text-foreground">{ds.sensorType}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">All Signals</p>
                                <p className="text-foreground">{ds.signals.join(' · ')}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Use Cases</p>
                                <p className="text-foreground">{ds.useCases.join(' · ')}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
