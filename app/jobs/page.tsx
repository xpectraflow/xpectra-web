'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';

const jobs = [
  {
    id: '1',
    name: 'Ingest MOSDAC Satellite Feed',
    dataset: 'MOSDAC',
    cluster: 'Default Processing Cluster',
    schedule: 'Continuous',
    status: 'Running',
  },
  {
    id: '2',
    name: 'Aggregate AQI Hourly Metrics',
    dataset: 'AQI',
    cluster: 'Batch Analytics Cluster',
    schedule: 'Hourly',
    status: 'Scheduled',
  },
  {
    id: '3',
    name: 'Validate Sensor Schema',
    dataset: 'All datasets',
    cluster: 'Default Processing Cluster',
    schedule: 'On device add',
    status: 'Paused',
  },
];

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
        return 'bg-green-900/30 text-green-300';
      case 'Scheduled':
        return 'bg-primary/20 text-primary';
      case 'Paused':
        return 'bg-accent text-muted-foreground';
      default:
        return 'bg-accent text-muted-foreground';
    }
  };

  return (
    <PageLayout title="Jobs" description="Data processing jobs operating on datasets">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-card/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Job Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dataset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cluster
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Schedule
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className="cursor-pointer transition-colors hover:bg-card/50"
              >
                <td className="px-4 py-3 text-sm text-foreground">{job.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{job.dataset}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {job.cluster}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {job.schedule}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Job Details Modal (Read-only) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                ✕
              </button>
            </div>

            {(() => {
              const job = jobs.find((j) => j.id === selectedJob);
              if (!job) return null;

              return (
                <div className="space-y-6">
                  <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Job Name
                      </span>
                      <span className="text-sm text-foreground">{job.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Dataset
                      </span>
                      <span className="text-sm text-muted-foreground">{job.dataset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Cluster
                      </span>
                      <span className="text-sm text-muted-foreground">{job.cluster}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Schedule
                      </span>
                      <span className="text-sm text-muted-foreground">{job.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Status
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>

                  {/* Execution Timeline */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Execution Timeline
                    </h3>
                    <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-2 w-2 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            Job created
                          </div>
                          <div className="text-xs text-muted-foreground">
                            2024-01-15 10:30:00 UTC
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-2 w-2 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            Scheduled
                          </div>
                          <div className="text-xs text-muted-foreground">
                            2024-01-15 10:35:00 UTC
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-2 w-2 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            Last dataset
                          </div>
                          <div className="text-xs text-muted-foreground">
                            2024-01-20 14:22:00 UTC
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-2 w-2 items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            Last success
                          </div>
                          <div className="text-xs text-muted-foreground">
                            2024-01-20 14:22:00 UTC
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

