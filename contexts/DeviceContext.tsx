'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Device {
  id: string;
  // Device Identity
  name: string;
  deviceId: string;
  type: 'Satellite-derived' | 'Ground Sensor' | 'Weather Station' | 'Air Quality Monitor' | 'Custom';
  status: 'Provisioned' | 'Active' | 'Inactive';
  // Sensor Definition
  sensorCategory: 'Environmental' | 'Atmospheric' | 'Industrial' | 'Energy';
  measuredSignals: string[];
  unitSystem: 'SI' | 'Metric (custom)';
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

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old devices to include all required fields
        const migrated = parsed.map((device: any) => ({
          ...device,
          status: device.status || 'Provisioned',
          source: device.source || 'Internal',
          measuredSignals: device.measuredSignals || [],
          sensorCategory: device.sensorCategory || 'Environmental',
          unitSystem: device.unitSystem || 'SI',
          locationType: device.locationType || 'Fixed',
          dataFrequency: device.dataFrequency || 'Every 5 min',
          dataFormat: device.dataFormat || 'JSON',
          expectedLatency: device.expectedLatency || 'Near real-time',
        }));
        setDevices(migrated);
      } catch (error) {
        console.error('Failed to parse stored devices:', error);
      }
    }
  }, []);

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
