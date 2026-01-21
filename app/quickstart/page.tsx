'use client';

import { useState } from 'react';
import { Plus, Database, Zap, ArrowRight, Server } from 'lucide-react';
import Link from 'next/link';
import { PageLayout } from '@/components/PageLayout';
import { AddDeviceModal } from '@/components/AddDeviceModal';

export default function QuickstartPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageLayout title="Quickstart" description="">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="mb-3 text-3xl font-bold text-white">
              Get started in 3 steps
            </h1>
            <p className="text-lg text-gray-400">
              Model your sensors, organize datasets, and orchestrate compute.
            </p>
          </div>

          {/* Steps Section */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  1
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Define a Device
                </h2>
              </div>
              <p className="mb-6 text-sm text-gray-400">
                Describe a physical or virtual sensor and what it emits.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Device
              </button>
            </div>

            {/* Step 2 */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-gray-300">
                  2
                </div>
                <h2 className="text-lg font-semibold text-white">
                  View Datasets
                </h2>
              </div>
              <p className="mb-6 text-sm text-gray-400">
                Devices become datasets you can inspect and process.
              </p>
              <Link
                href="/datasets"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <Database className="h-4 w-4" />
                View My Datasets
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Step 3 */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-semibold text-gray-300">
                  3
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Run Compute
                </h2>
              </div>
              <p className="mb-6 text-sm text-gray-400">
                Attach jobs and automations to process data.
              </p>
              <div className="space-y-2">
                <Link
                  href="/jobs"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <Zap className="h-4 w-4" />
                  View Jobs
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/clusters"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <Server className="h-4 w-4" />
                  View Clusters
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Hint */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Once defined, datasets can be linked to jobs, automations, and
              clusters.
            </p>
          </div>
        </div>
      </PageLayout>

      <AddDeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
