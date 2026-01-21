'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDevices, Device } from '@/contexts/DeviceContext';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIGNAL_OPTIONS = [
  'Temperature',
  'Humidity',
  'Pressure',
  'Wind Speed',
  'Wind Direction',
  'PM2.5',
  'PM10',
  'CO₂',
  'Rainfall',
];

export function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  const { addDevice } = useDevices();
  const [formData, setFormData] = useState({
    // Device Identity
    name: '',
    deviceId: '',
    type: 'Ground Sensor' as Device['type'],
    // Sensor Definition
    sensorCategory: 'Environmental' as Device['sensorCategory'],
    measuredSignals: [] as string[],
    unitSystem: 'SI' as Device['unitSystem'],
    // Location & Coverage
    locationType: 'Fixed' as Device['locationType'],
    latitude: '',
    longitude: '',
    region: '',
    // Data Emission Profile
    dataFrequency: 'Every 5 min' as Device['dataFrequency'],
    dataFormat: 'JSON' as Device['dataFormat'],
    expectedLatency: 'Near real-time' as Device['expectedLatency'],
    // Metadata
    owner: '',
    source: '',
    notes: '',
  });

  // Auto-generate Device ID from Device Name (only when deviceId is empty)
  useEffect(() => {
    if (formData.name && !formData.deviceId) {
      const generatedId = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, deviceId: generatedId }));
    }
  }, [formData.name]);

  if (!isOpen) return null;

  const handleSignalToggle = (signal: string) => {
    setFormData((prev) => ({
      ...prev,
      measuredSignals: prev.measuredSignals.includes(signal)
        ? prev.measuredSignals.filter((s) => s !== signal)
        : [...prev.measuredSignals, signal],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.deviceId.trim()) {
      return;
    }

    addDevice({
      name: formData.name.trim(),
      deviceId: formData.deviceId.trim(),
      type: formData.type,
      sensorCategory: formData.sensorCategory,
      measuredSignals: formData.measuredSignals,
      unitSystem: formData.unitSystem,
      locationType: formData.locationType,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      region: formData.region.trim() || undefined,
      dataFrequency: formData.dataFrequency,
      dataFormat: formData.dataFormat,
      expectedLatency: formData.expectedLatency,
      owner: formData.owner.trim() || undefined,
      source: formData.source.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });

    // Reset form
    setFormData({
      name: '',
      deviceId: '',
      type: 'Ground Sensor',
      sensorCategory: 'Environmental',
      measuredSignals: [],
      unitSystem: 'SI',
      locationType: 'Fixed',
      latitude: '',
      longitude: '',
      region: '',
      dataFrequency: 'Every 5 min',
      dataFormat: 'JSON',
      expectedLatency: 'Near real-time',
      owner: '',
      source: '',
      notes: '',
    });

    // Close modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Add Device</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* 1. Device Identity */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  1. Device Identity
                </h3>
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
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
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="e.g., Mumbai AQI Station 01"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deviceId"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Device ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="deviceId"
                      type="text"
                      required
                      value={formData.deviceId}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceId: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="e.g., mumbai-aqi-station-01"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Stable identifier used in pipelines
                    </p>
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
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as Device['type'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="Satellite-derived">Satellite-derived</option>
                      <option value="Ground Sensor">Ground Sensor</option>
                      <option value="Weather Station">Weather Station</option>
                      <option value="Air Quality Monitor">Air Quality Monitor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Sensor Definition */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  2. Sensor Definition
                </h3>
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                  <div>
                    <label
                      htmlFor="sensorCategory"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Sensor Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="sensorCategory"
                      required
                      value={formData.sensorCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sensorCategory: e.target.value as Device['sensorCategory'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="Environmental">Environmental</option>
                      <option value="Atmospheric">Atmospheric</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Energy">Energy</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Measured Signals
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SIGNAL_OPTIONS.map((signal) => (
                        <label
                          key={signal}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-900 hover:border-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={formData.measuredSignals.includes(signal)}
                            onChange={() => handleSignalToggle(signal)}
                            className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-600 focus:ring-blue-500"
                          />
                          <span>{signal}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="unitSystem"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Unit System <span className="text-red-400">*</span>
                    </label>
                    <select
                      id="unitSystem"
                      required
                      value={formData.unitSystem}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          unitSystem: e.target.value as Device['unitSystem'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="SI">SI</option>
                      <option value="Metric (custom)">Metric (custom)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Coverage */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  3. Location & Coverage
                </h3>
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                  <div>
                    <label
                      htmlFor="locationType"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Location Type
                    </label>
                    <select
                      id="locationType"
                      value={formData.locationType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          locationType: e.target.value as Device['locationType'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="Fixed">Fixed</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Region-based">Region-based</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="latitude"
                        className="mb-1 block text-sm font-medium text-gray-300"
                      >
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData({ ...formData, latitude: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                        placeholder="e.g., 19.0760"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="longitude"
                        className="mb-1 block text-sm font-medium text-gray-300"
                      >
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData({ ...formData, longitude: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                        placeholder="e.g., 72.8777"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Region / Coverage Area
                    </label>
                    <input
                      id="region"
                      type="text"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="e.g., Mumbai Metropolitan Region"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Data Emission Profile */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  4. Data Emission Profile
                </h3>
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                  <div>
                    <label
                      htmlFor="dataFrequency"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Data Frequency
                    </label>
                    <select
                      id="dataFrequency"
                      value={formData.dataFrequency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataFrequency: e.target.value as Device['dataFrequency'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="Real-time">Real-time</option>
                      <option value="Every 1 min">Every 1 min</option>
                      <option value="Every 5 min">Every 5 min</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="dataFormat"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Data Format
                    </label>
                    <select
                      id="dataFormat"
                      value={formData.dataFormat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataFormat: e.target.value as Device['dataFormat'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="JSON">JSON</option>
                      <option value="CSV">CSV</option>
                      <option value="Binary (simulated)">Binary (simulated)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="expectedLatency"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Expected Latency
                    </label>
                    <select
                      id="expectedLatency"
                      value={formData.expectedLatency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expectedLatency: e.target.value as Device['expectedLatency'],
                        })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-gray-700 focus:outline-none"
                    >
                      <option value="Near real-time">Near real-time</option>
                      <option value="5–15 min">5–15 min</option>
                      <option value="Batch">Batch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  5. Metadata
                </h3>
                <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                  <div>
                    <label
                      htmlFor="owner"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Owner / Team
                    </label>
                    <input
                      id="owner"
                      type="text"
                      value={formData.owner}
                      onChange={(e) =>
                        setFormData({ ...formData, owner: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="e.g., Climate Analytics Team"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="source"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Source
                    </label>
                    <input
                      id="source"
                      type="text"
                      value={formData.source}
                      onChange={(e) =>
                        setFormData({ ...formData, source: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="e.g., IMD, ISRO, CPCB, Internal"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="mb-1 block text-sm font-medium text-gray-300"
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-700 focus:outline-none"
                      placeholder="Additional notes or context..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex gap-3 border-t border-gray-800 pt-6">
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
