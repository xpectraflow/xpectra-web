'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Device {
  id: string;
  // Device Identity
  name: string;
  deviceId: string;
  type: 'Satellite-derived' | 'Ground Sensor' | 'Weather Station' | 'Air Quality Monitor' | 'Custom';
  status: 'Provisioned' | 'Active' | 'Inactive';
  // Sensor Outputs
  signalCategory: string[]; // Multi-select: Scalar, Vector, Event, State, Media, Custom
  signalsEmitted: string[]; // Multi-select: Numeric value, Categorical value, Boolean flag, etc.
  signalDimensionality: 'Single-channel' | 'Multi-channel' | 'Multi-modal';
  primaryTimeAxis: 'Event time' | 'Ingest time' | 'Processing time';
  valueCharacteristics?: string[]; // Optional: Continuous, Discrete, Bursty, Periodic
  // Legacy fields for backward compatibility
  sensorCategory?: 'Environmental' | 'Atmospheric' | 'Industrial' | 'Energy';
  measuredSignals?: string[];
  unitSystem?: 'SI' | 'Metric (custom)';
  // Location & Coverage
  locationType: 'Fixed' | 'Mobile' | 'Region-based';
  latitude?: number;
  longitude?: number;
  region?: string;
  // Data Emission Profile
  dataFrequency: 'Real-time' | 'Every 1 min' | 'Every 5 min' | 'Hourly';
  dataFormat: 'JSON' | 'CSV' | 'Binary (simulated)';
  expectedLatency: 'Near real-time' | '5–15 min' | 'Batch';
  // Metadata
  owner?: string;
  source?: string;
  notes?: string;
  createdAt: string;
}

interface DeviceContextType {
  devices: Device[];
  addDevice: (device: Omit<Device, 'id' | 'createdAt'>) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

const STORAGE_KEY = 'devices';

type StoredDevice = Partial<Device> & {
  id?: unknown;
  name?: unknown;
  deviceId?: unknown;
  type?: unknown;
  createdAt?: unknown;
};

function isStoredDevice(value: unknown): value is StoredDevice {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as StoredDevice;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.deviceId === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

function migrateStoredDevice(device: StoredDevice): Device {
  return {
    ...device,
    id: device.id as string,
    name: device.name as string,
    deviceId: device.deviceId as string,
    type: device.type as Device['type'],
    createdAt: device.createdAt as string,
    status: (device.status as Device['status']) || 'Provisioned',
    source: device.source || 'Internal',
    signalCategory: device.signalCategory || [],
    signalsEmitted: device.signalsEmitted || [],
    signalDimensionality:
      (device.signalDimensionality as Device['signalDimensionality']) ||
      'Single-channel',
    primaryTimeAxis:
      (device.primaryTimeAxis as Device['primaryTimeAxis']) || 'Event time',
    valueCharacteristics: device.valueCharacteristics || [],
    measuredSignals: device.measuredSignals || [],
    sensorCategory:
      (device.sensorCategory as Device['sensorCategory']) || 'Environmental',
    unitSystem: (device.unitSystem as Device['unitSystem']) || 'SI',
    locationType: (device.locationType as Device['locationType']) || 'Fixed',
    dataFrequency:
      (device.dataFrequency as Device['dataFrequency']) || 'Every 5 min',
    dataFormat: (device.dataFormat as Device['dataFormat']) || 'JSON',
    expectedLatency:
      (device.expectedLatency as Device['expectedLatency']) || 'Near real-time',
  };
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(isStoredDevice).map(migrateStoredDevice);
    } catch (error) {
      console.error('Failed to parse stored devices:', error);
      return [];
    }
  });

  // Save to localStorage whenever devices change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  }, [devices]);

  const addDevice = (deviceData: Omit<Device, 'id' | 'createdAt'>) => {
    const newDevice: Device = {
      ...deviceData,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };
    setDevices((prev) => [...prev, newDevice]);
  };

  return (
    <DeviceContext.Provider value={{ devices, addDevice }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevices() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
}
