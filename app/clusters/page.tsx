'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { useClusters } from '@/contexts/ClusterContext';
import { AddCustomClusterModal } from '@/components/AddCustomClusterModal';

export default function ClustersPage() {
  const { clusters } = useClusters();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageLayout
        title="Clusters"
        description="Compute environments for processing sensor data"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Custom Cluster
          </button>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {clusters.map((cluster, index) => (
            <div
              key={cluster.id || index}
              className="rounded-lg border border-gray-800 bg-gray-900/50 p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {cluster.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    {cluster.primaryUse || cluster.workload}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      cluster.status === 'Active'
                        ? 'bg-green-900/30 text-green-300'
                        : cluster.status === 'Provisioning'
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {cluster.status}
                  </span>
                  {cluster.status === 'Provisioning' && (
                    <p className="text-xs text-gray-500">
                      Cluster setup in progress
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type</span>
                  <span className="text-gray-300">
                    {cluster.type || cluster.computeType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Region</span>
                  <span className="text-gray-300">{cluster.region}</span>
                </div>
                {cluster.provider && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Provider</span>
                    <span className="text-gray-300">{cluster.provider}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageLayout>

      <AddCustomClusterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
