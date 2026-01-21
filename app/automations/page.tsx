import { PageLayout } from '@/components/PageLayout';

const automations = [
  {
    name: 'Run validation when new device is added',
    trigger: 'Device created',
    action: 'Run "Validate Sensor Schema"',
    status: 'Enabled',
  },
  {
    name: 'Pause jobs on excessive data volume',
    trigger: 'Data volume threshold exceeded',
    action: 'Pause affected jobs',
    status: 'Disabled',
  },
];

export default function AutomationsPage() {
  return (
    <PageLayout
      title="Automations"
      description="Rule-based triggers that control when jobs run"
    >
      <div className="space-y-4">
        {automations.map((automation, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-800 bg-gray-900/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">
                  {automation.name}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Trigger:</span>
                    <span className="ml-2 text-gray-300">{automation.trigger}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Action:</span>
                    <span className="ml-2 text-gray-300">{automation.action}</span>
                  </div>
                </div>
              </div>
              <span
                className={`ml-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  automation.status === 'Enabled'
                    ? 'bg-green-900/30 text-green-300'
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                {automation.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
