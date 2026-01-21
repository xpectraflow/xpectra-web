import { PageLayout } from '@/components/PageLayout';

const clusters = [
  {
    name: 'Default Processing Cluster',
    type: 'CPU',
    region: 'ap-south-1',
    status: 'Active',
    primaryUse: 'Ingestion & validation',
  },
  {
    name: 'Batch Analytics Cluster',
    type: 'GPU',
    region: 'ap-south-1',
    status: 'Idle',
    primaryUse: 'Historical & batch analytics',
  },
];

export default function ClustersPage() {
  return (
    <PageLayout
      title="Clusters"
      description="Compute environments for processing sensor data"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {clusters.map((cluster, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {cluster.name}
                </h3>
                <p className="mt-1 text-sm text-gray-400">{cluster.primaryUse}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  cluster.status === 'Active'
                    ? 'bg-green-900/30 text-green-300'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                {cluster.status}
              </span>
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type</span>
                <span className="text-gray-300">{cluster.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Region</span>
                <span className="text-gray-300">{cluster.region}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
