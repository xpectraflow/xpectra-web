'use client';

import { useState, FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDevices, Device } from '@/contexts/DeviceContext';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIGNAL_CATEGORIES = [
  'Scalar',
  'Vector',
  'Event',
  'State',
  'Media',
  'Custom',
];

const SIGNALS_EMITTED = [
  'Numeric value',
  'Categorical value',
  'Boolean flag',
  'Time series',
  'Geospatial coordinate',
  'Vector / multi-axis data',
  'Event log',
  'Binary payload',
  'Image / raster',
  'Custom signal',
];

const VALUE_CHARACTERISTICS = [
  'Continuous',
  'Discrete',
  'Bursty',
  'Periodic',
];

export function AddDeviceModal({ isOpen, onClose }: AddDeviceModalProps) {
  const { addDevice } = useDevices();
  const [formData, setFormData] = useState({
    // Device Identity
    name: '',
    deviceId: '',
    type: 'Ground Sensor' as Device['type'],
    // Sensor Outputs
    signalCategory: [] as string[],
    signalsEmitted: [] as string[],
    signalDimensionality: 'Single-channel' as Device['signalDimensionality'],
    primaryTimeAxis: 'Event time' as Device['primaryTimeAxis'],
    valueCharacteristics: [] as string[],
    showValueCharacteristics: false,
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

  const handleMultiSelectToggle = (
    field: 'signalCategory' | 'signalsEmitted' | 'valueCharacteristics',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
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
      status: 'Provisioned',
      signalCategory: formData.signalCategory,
      signalsEmitted: formData.signalsEmitted,
      signalDimensionality: formData.signalDimensionality,
      primaryTimeAxis: formData.primaryTimeAxis,
      valueCharacteristics:
        formData.valueCharacteristics.length > 0
          ? formData.valueCharacteristics
          : undefined,
      locationType: formData.locationType,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      region: formData.region.trim() || undefined,
      dataFrequency: formData.dataFrequency,
      dataFormat: formData.dataFormat,
      expectedLatency: formData.expectedLatency,
      owner: formData.owner.trim() || undefined,
      source: formData.source.trim() || 'Internal',
      notes: formData.notes.trim() || undefined,
    });

    // Reset form
    setFormData({
      name: '',
      deviceId: '',
      type: 'Ground Sensor',
      signalCategory: [],
      signalsEmitted: [],
      signalDimensionality: 'Single-channel',
      primaryTimeAxis: 'Event time',
      valueCharacteristics: [],
      showValueCharacteristics: false,
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
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Add Device</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* 1. Device Identity */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  1. Device Identity
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Device Name <span className="text-destructive">*</span>
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
                      placeholder="e.g., Mumbai AQI Station 01"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deviceId"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Device ID <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="deviceId"
                      type="text"
                      required
                      value={formData.deviceId}
                      onChange={(e) =>
                        setFormData({ ...formData, deviceId: e.target.value })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="e.g., mumbai-aqi-station-01"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Stable identifier used in pipelines
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Device Type <span className="text-destructive">*</span>
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
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

            {/* 2. Sensor Outputs */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  2. Sensor Outputs
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Signal Category
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Describes the type of data emitted by the device.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SIGNAL_CATEGORIES.map((category) => (
                        <label
                          key={category}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:border-input"
                        >
                          <input
                            type="checkbox"
                            checked={formData.signalCategory.includes(category)}
                            onChange={() =>
                              handleMultiSelectToggle('signalCategory', category)
                            }
                            className="h-4 w-4 rounded border-input bg-card text-primary focus:ring-ring"
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Signals Emitted
                    </label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Select the data primitives produced by this device.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SIGNALS_EMITTED.map((signal) => (
                        <label
                          key={signal}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:border-input"
                        >
                          <input
                            type="checkbox"
                            checked={formData.signalsEmitted.includes(signal)}
                            onChange={() =>
                              handleMultiSelectToggle('signalsEmitted', signal)
                            }
                            className="h-4 w-4 rounded border-input bg-card text-primary focus:ring-ring"
                          />
                          <span>{signal}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signalDimensionality"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Signal Dimensionality
                    </label>
                    <select
                      id="signalDimensionality"
                      value={formData.signalDimensionality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          signalDimensionality: e.target.value as Device['signalDimensionality'],
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="Single-channel">Single-channel</option>
                      <option value="Multi-channel">Multi-channel</option>
                      <option value="Multi-modal">Multi-modal</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="primaryTimeAxis"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
                    >
                      Primary Time Axis
                    </label>
                    <select
                      id="primaryTimeAxis"
                      value={formData.primaryTimeAxis}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primaryTimeAxis: e.target.value as Device['primaryTimeAxis'],
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="Event time">Event time</option>
                      <option value="Ingest time">Ingest time</option>
                      <option value="Processing time">Processing time</option>
                    </select>
                  </div>

                  {/* Optional: Value Characteristics (Collapsed by Default) */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          showValueCharacteristics:
                            !formData.showValueCharacteristics,
                        })
                      }
                      className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-accent-foreground"
                    >
                      <span>Value Characteristics (Optional)</span>
                      <span className="text-muted-foreground">
                        {formData.showValueCharacteristics ? '−' : '+'}
                      </span>
                    </button>
                    {formData.showValueCharacteristics && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 gap-2">
                          {VALUE_CHARACTERISTICS.map((characteristic) => (
                            <label
                              key={characteristic}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:border-input"
                            >
                              <input
                                type="checkbox"
                                checked={formData.valueCharacteristics.includes(
                                  characteristic
                                )}
                                onChange={() =>
                                  handleMultiSelectToggle(
                                    'valueCharacteristics',
                                    characteristic
                                  )
                                }
                                className="h-4 w-4 rounded border-input bg-card text-primary focus:ring-ring"
                              />
                              <span>{characteristic}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Coverage */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Location & Coverage
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="locationType"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
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
                        className="mb-1 block text-sm font-medium text-muted-foreground"
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
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                        placeholder="e.g., 19.0760"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="longitude"
                        className="mb-1 block text-sm font-medium text-muted-foreground"
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
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                        placeholder="e.g., 72.8777"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="region"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="e.g., Mumbai Metropolitan Region"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Data Emission Profile */}
            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  4. Data Emission Profile
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="dataFrequency"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
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
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
                    >
                      <option value="JSON">JSON</option>
                      <option value="CSV">CSV</option>
                      <option value="Binary (simulated)">Binary (simulated)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="expectedLatency"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-input focus:outline-none"
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
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  5. Metadata
                </h3>
                <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
                  <div>
                    <label
                      htmlFor="owner"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="e.g., Climate Analytics Team"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="source"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="e.g., IMD, ISRO, CPCB, Internal"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="mb-1 block text-sm font-medium text-muted-foreground"
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
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none"
                      placeholder="Additional notes or context..."
                    />
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
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

