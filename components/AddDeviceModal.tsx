'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useDevices, Device } from '@/contexts/DeviceContext';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  const { addDevice } = useDevices();
  const [formData, setFormData] = useState({
    name: '',
    type: 'Inverter' as Device['type'],
    topic: '',
    interval: 5,
    location: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    addDevice({
      name: formData.name.trim(),
      type: formData.type,
      topic: formData.topic.trim() || undefined,
      interval: formData.interval,
    });

    // Reset form
    setFormData({
      name: '',
      type: 'Inverter',
      topic: '',
      interval: 5,
      location: '',
    });

    // Close modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Add Device</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Device Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
              placeholder="Enter device name"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Device Type <span className="text-red-400">*</span>
            </label>
            <select
              id="type"
              required
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as Device['type'] })
              }
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
            >
              <option value="Pressure">Pressure</option>
              <option value="Temperature">Temperature</option>
              <option value="IMU">IMU</option>
              <option value="LIDAR">LIDAR</option>
              <option value="RADAR">RADAR</option>
              <option value="BIN">BIN</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="topic"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              MQTT Topic
            </label>
            <input
              id="topic"
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
              placeholder="Enter MQTT topic (optional)"
            />
          </div>

          <div>
            <label
              htmlFor="interval"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Send Interval
            </label>
            <input
              id="interval"
              type="number"
              min="1"
              value={formData.interval}
              onChange={(e) =>
                setFormData({ ...formData, interval: parseInt(e.target.value) || 5 })
              }
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
              placeholder="Enter location (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
