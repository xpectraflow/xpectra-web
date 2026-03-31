'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { useClusters } from '@/contexts/ClusterContext';

interface AddCustomClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AWS_REGIONS = ['ap-south-1', 'us-east-1', 'eu-west-1'];
const GCP_REGIONS = ['asia-south1', 'us-central1', 'europe-west1'];

const WORKLOADS = [
  'Ingestion & validation',
  'Streaming analytics',
  'Batch analytics',
  'ML / simulation',
];

export function AddCustomClusterModal({
  isOpen,
  onClose,
}: AddCustomClusterModalProps) {
  const { addCluster } = useClusters();
  const [formData, setFormData] = useState({
    provider: 'AWS' as 'AWS' | 'GCP',
    name: '',
    region: '',
    computeType: 'CPU' as 'CPU' | 'GPU',
    accessKeyId: '',
    secretAccessKey: '',
    workload: 'Ingestion & validation',
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.region || !formData.accessKeyId.trim() || !formData.secretAccessKey.trim()) {
      return;
    }

    addCluster({
      name: formData.name.trim(),
      provider: formData.provider,
      region: formData.region,
      computeType: formData.computeType,
      workload: formData.workload,
    });

    // Reset form
    setFormData({
      provider: 'AWS',
      name: '',
      region: '',
      computeType: 'CPU',
      accessKeyId: '',
      secretAccessKey: '',
      workload: 'Ingestion & validation',
    });

    // Close modal
    onClose();
  };

  const currentRegions = formData.provider === 'AWS' ? AWS_REGIONS : GCP_REGIONS;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Add Custom Cluster</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 1. Cloud Provider */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Cloud Provider
                </h3>
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="provider"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Cloud Provider <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="provider"
                      required
                      value={formData.provider}
                      onChange={(e) => {
                        const newProvider = e.target.value as 'AWS' | 'GCP';
                        setFormData({
                          ...formData,
                          provider: newProvider,
                          region: '', // Reset region when provider changes
                        });
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="AWS">AWS</option>
                      <option value="GCP">GCP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Cluster Identity */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Cluster Identity
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Cluster Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="prod-analytics-cluster"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Region <span className="text-destructive">*</span>
                    </label>
                    <select
                      id="region"
                      required
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="">Select region</option>
                      {currentRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="computeType"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Compute Type
                    </label>
                    <select
                      id="computeType"
                      value={formData.computeType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          computeType: e.target.value as 'CPU' | 'GPU',
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="CPU">CPU</option>
                      <option value="GPU">GPU</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Cloud Access */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Cloud Access
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="accessKeyId"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Access Key ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="accessKeyId"
                      type="password"
                      required
                      value={formData.accessKeyId}
                      onChange={(e) =>
                        setFormData({ ...formData, accessKeyId: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="Enter access key ID"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="secretAccessKey"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Secret Access Key <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="secretAccessKey"
                      type="password"
                      required
                      value={formData.secretAccessKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secretAccessKey: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="Enter secret access key"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Credentials are used only to establish cluster connectivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Intent */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  4. Intent
                </h3>
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="workload"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Primary Workload
                    </label>
                    <select
                      id="workload"
                      value={formData.workload}
                      onChange={(e) =>
                        setFormData({ ...formData, workload: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      {WORKLOADS.map((workload) => (
                        <option key={workload} value={workload}>
                          {workload}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex gap-3 border-t border-border pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:opacity-90"
            >
              Add Cluster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

