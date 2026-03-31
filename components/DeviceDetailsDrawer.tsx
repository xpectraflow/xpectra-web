'use client';

import { X } from 'lucide-react';
import { Device } from '@/contexts/DeviceContext';

interface DeviceDetailsDrawerProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

const getSignalUnit = (signal: string): string => {
  const units: Record<string, string> = {
    Temperature: '°C',
    Humidity: '%',
    Pressure: 'hPa',
    'Wind Speed': 'm/s',
    'Wind Direction': '°',
    'PM2.5': 'µg/m³',
    PM10: 'µg/m³',
    'CO₂': 'ppm',
    Rainfall: 'mm',
  };
  return units[signal] || '';
};

export function DeviceDetailsDrawer({
  device,
  isOpen,
  onClose,
}: DeviceDetailsDrawerProps) {
  if (!isOpen || !device) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="text-xl font-semibold text-foreground">Device Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Device Identity */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Device Identity
              </h3>
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Name</span>
                  <span className="mt-1 text-sm text-foreground">{device.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Device ID
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground font-mono">
                    {device.deviceId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Type</span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.type}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <span className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        device.status === 'Active'
                          ? 'bg-green-900/30 text-green-300'
                          : device.status === 'Inactive'
                          ? 'bg-destructive/20 text-destructive-foreground'
                          : 'bg-accent text-muted-foreground'
                      }`}
                    >
                      {device.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sensor Outputs */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Sensor Outputs
              </h3>
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                {device.signalCategory && device.signalCategory.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Signal Category
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {device.signalCategory.map((category) => (
                        <span
                          key={category}
                          className="rounded-md bg-primary/20 px-2 py-1 text-xs text-primary"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : device.sensorCategory ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Category
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      {device.sensorCategory}
                    </span>
                  </div>
                ) : null}

                {device.signalsEmitted && device.signalsEmitted.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Signals Emitted
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {device.signalsEmitted.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-md bg-green-900/30 px-2 py-1 text-xs text-green-300"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : device.measuredSignals &&
                  device.measuredSignals.length > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Measured Signals
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {device.measuredSignals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-md bg-primary/20 px-2 py-1 text-xs text-primary"
                        >
                          {signal} {getSignalUnit(signal)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Signals Emitted
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      None selected
                    </span>
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Signal Dimensionality
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.signalDimensionality || 'Single-channel'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Primary Time Axis
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.primaryTimeAxis || 'Event time'}
                  </span>
                </div>

                {device.valueCharacteristics &&
                  device.valueCharacteristics.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Value Characteristics
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {device.valueCharacteristics.map((char) => (
                          <span
                            key={char}
                            className="rounded-md bg-purple-900/30 px-2 py-1 text-xs text-purple-300"
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {device.unitSystem && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Unit System
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      {device.unitSystem}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </h3>
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Location Type
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.locationType}
                  </span>
                </div>
                {(device.latitude || device.longitude) && (
                  <div className="grid grid-cols-2 gap-4">
                    {device.latitude && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                          Latitude
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {device.latitude}
                        </span>
                      </div>
                    )}
                    {device.longitude && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                          Longitude
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground">
                          {device.longitude}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {device.region && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      Region / Coverage Area
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      {device.region}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Emission Profile */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Emission Profile
              </h3>
              <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Data Frequency
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.dataFrequency}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Data Format
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.dataFormat}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    Expected Latency
                  </span>
                  <span className="mt-1 text-sm text-muted-foreground">
                    {device.expectedLatency}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {(device.owner || device.source || device.notes) && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Metadata
                </h3>
                <div className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                  {device.owner && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Owner / Team
                      </span>
                      <span className="mt-1 text-sm text-muted-foreground">
                        {device.owner}
                      </span>
                    </div>
                  )}
                  {device.source && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Source
                      </span>
                      <span className="mt-1 text-sm text-muted-foreground">
                        {device.source}
                      </span>
                    </div>
                  )}
                  {device.notes && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-muted-foreground">
                        Notes
                      </span>
                      <span className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {device.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

