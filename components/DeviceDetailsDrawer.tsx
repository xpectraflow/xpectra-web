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
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto border-l border-gray-800 bg-gray-900 shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Device Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Device Identity */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Device Identity
              </h3>
              <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">Name</span>
                  <span className="mt-1 text-sm text-white">{device.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Device ID
                  </span>
                  <span className="mt-1 text-sm text-gray-300 font-mono">
                    {device.deviceId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">Type</span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.type}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">Status</span>
                  <span className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        device.status === 'Active'
                          ? 'bg-green-900/30 text-green-300'
                          : device.status === 'Inactive'
                          ? 'bg-red-900/30 text-red-300'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {device.status}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sensor Signals */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Sensor Signals
              </h3>
              <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Category
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.sensorCategory}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Measured Signals
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {device.measuredSignals &&
                    device.measuredSignals.length > 0 ? (
                      device.measuredSignals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-md bg-blue-900/30 px-2 py-1 text-xs text-blue-300"
                        >
                          {signal} {getSignalUnit(signal)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">None selected</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Unit System
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.unitSystem}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Location
              </h3>
              <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Location Type
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.locationType}
                  </span>
                </div>
                {(device.latitude || device.longitude) && (
                  <div className="grid grid-cols-2 gap-4">
                    {device.latitude && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-400">
                          Latitude
                        </span>
                        <span className="mt-1 text-sm text-gray-300">
                          {device.latitude}
                        </span>
                      </div>
                    )}
                    {device.longitude && (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-400">
                          Longitude
                        </span>
                        <span className="mt-1 text-sm text-gray-300">
                          {device.longitude}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {device.region && (
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-400">
                      Region / Coverage Area
                    </span>
                    <span className="mt-1 text-sm text-gray-300">
                      {device.region}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Emission Profile */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Emission Profile
              </h3>
              <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Data Frequency
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.dataFrequency}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Data Format
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.dataFormat}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-400">
                    Expected Latency
                  </span>
                  <span className="mt-1 text-sm text-gray-300">
                    {device.expectedLatency}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {(device.owner || device.source || device.notes) && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Metadata
                </h3>
                <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/50 p-4">
                  {device.owner && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-400">
                        Owner / Team
                      </span>
                      <span className="mt-1 text-sm text-gray-300">
                        {device.owner}
                      </span>
                    </div>
                  )}
                  {device.source && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-400">
                        Source
                      </span>
                      <span className="mt-1 text-sm text-gray-300">
                        {device.source}
                      </span>
                    </div>
                  )}
                  {device.notes && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-400">
                        Notes
                      </span>
                      <span className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
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
