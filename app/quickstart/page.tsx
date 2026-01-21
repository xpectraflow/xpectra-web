'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { AddDeviceModal } from '@/components/AddDeviceModal';

export default function QuickstartPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <PageLayout
        title="Quickstart"
        description="Get started with the data platform"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Device
          </button>
        }
      >
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8">
          <p className="text-gray-400">
            This is the quickstart guide. Follow these steps to begin using the
            platform.
          </p>
        </div>
      </PageLayout>
      <AddDeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
