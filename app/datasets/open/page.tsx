'use client';

import { PageLayout } from '@/components/PageLayout';

export default function OpenDataPage() {
  return (
    <PageLayout
      title="Open Data"
      description="Public sensor datasets commonly used by geospatial and climate teams."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* MOSDAC Dataset Card */}
        <div className="group relative min-h-[400px] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700 hover:shadow-lg hover:shadow-black/20">
          {/* Default View */}
          <div className="transition-opacity group-hover:opacity-0 group-hover:pointer-events-none">
            <h3 className="mb-2 text-lg font-semibold text-white">
              MOSDAC Satellite Data
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-300">
                Satellite
              </span>
              <span className="rounded-md bg-green-900/30 px-2 py-1 text-xs font-medium text-green-300">
                Environmental
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Earth observation datasets from Indian meteorological satellites.
            </p>
          </div>

          {/* Hover Metadata */}
          <div className="absolute inset-0 p-6 opacity-0 transition-opacity group-hover:opacity-100 group-hover:overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-white">
              MOSDAC Satellite Data
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Source:</span>
                <span className="mt-1 text-gray-300">ISRO / MOSDAC</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Sensor Type:</span>
                <span className="mt-1 text-gray-300">
                  Satellite (INSAT, SCATSAT)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Signals:</span>
                <span className="mt-1 text-gray-300">
                  Cloud cover · Rainfall · Wind vectors · Sea surface temperature
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Coverage:</span>
                <span className="mt-1 text-gray-300">
                  Indian subcontinent & Indian Ocean
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Resolution:</span>
                <div className="mt-1 space-y-1 text-gray-300">
                  <div>Temporal: 15 min – 3 hr</div>
                  <div>Spatial: 4–25 km</div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">
                  Typical Use Cases:
                </span>
                <span className="mt-1 text-gray-300">
                  Weather modeling · Energy forecasting · Disaster monitoring
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AQI Dataset Card */}
        <div className="group relative min-h-[400px] overflow-y-auto rounded-lg border border-gray-800 bg-gray-900/50 p-6 transition-all hover:border-gray-700 hover:shadow-lg hover:shadow-black/20">
          {/* Default View */}
          <div className="transition-opacity group-hover:opacity-0 group-hover:pointer-events-none">
            <h3 className="mb-2 text-lg font-semibold text-white">
              National Air Quality Index (AQI)
            </h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-md bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-300">
                Ground Sensors
              </span>
              <span className="rounded-md bg-orange-900/30 px-2 py-1 text-xs font-medium text-orange-300">
                Urban
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Real-time air quality measurements across Indian cities.
            </p>
          </div>

          {/* Hover Metadata */}
          <div className="absolute inset-0 p-6 opacity-0 transition-opacity group-hover:opacity-100 group-hover:overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold text-white">
              National Air Quality Index (AQI)
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Source:</span>
                <span className="mt-1 text-gray-300">
                  Central Pollution Control Board (CPCB)
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Sensor Type:</span>
                <span className="mt-1 text-gray-300">
                  Fixed ground monitoring stations
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Signals:</span>
                <span className="mt-1 text-gray-300">
                  PM2.5 · PM10 · NO₂ · SO₂ · CO · O₃
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Coverage:</span>
                <span className="mt-1 text-gray-300">Major Indian cities</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">Resolution:</span>
                <div className="mt-1 space-y-1 text-gray-300">
                  <div>Temporal: Hourly</div>
                  <div>Spatial: Station-level</div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-400">
                  Typical Use Cases:
                </span>
                <span className="mt-1 text-gray-300">
                  Urban analytics · Health risk modeling · Policy & compliance
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
