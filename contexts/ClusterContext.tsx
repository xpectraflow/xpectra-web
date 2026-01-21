'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Cluster {
  id: string;
  name: string;
  provider: 'AWS' | 'GCP';
  region: string;
  computeType: 'CPU' | 'GPU';
  workload: string;
  status: 'Provisioning' | 'Active' | 'Idle';
  source: 'User Cloud' | 'Platform';
  type?: string; // For backward compatibility with existing clusters
  primaryUse?: string; // For backward compatibility
}

interface ClusterContextType {
  clusters: Cluster[];
  addCluster: (cluster: Omit<Cluster, 'id' | 'status' | 'source'>) => void;
}

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

const STORAGE_KEY = 'clusters';

const defaultClusters: Cluster[] = [
  {
    id: 'default-1',
    name: 'Default Processing Cluster',
    provider: 'AWS',
    region: 'ap-south-1',
    computeType: 'CPU',
    workload: 'Ingestion & validation',
    status: 'Active',
    source: 'Platform',
    type: 'CPU',
    primaryUse: 'Ingestion & validation',
  },
  {
    id: 'default-2',
    name: 'Batch Analytics Cluster',
    provider: 'AWS',
    region: 'ap-south-1',
    computeType: 'GPU',
    workload: 'Historical & batch analytics',
    status: 'Idle',
    source: 'Platform',
    type: 'GPU',
    primaryUse: 'Historical & batch analytics',
  },
];

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [clusters, setClusters] = useState<Cluster[]>(defaultClusters);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge user clusters with defaults
        const allClusters = [...defaultClusters, ...parsed];
        setClusters(allClusters);
      } catch (error) {
        console.error('Failed to parse stored clusters:', error);
        // If parsing fails, use defaults only
        setClusters(defaultClusters);
      }
    }
  }, []);

  // Save to localStorage whenever clusters change (excluding defaults)
  useEffect(() => {
    const userClusters = clusters.filter((c) => c.source === 'User Cloud');
    if (userClusters.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userClusters));
    }
  }, [clusters]);

  const addCluster = (clusterData: Omit<Cluster, 'id' | 'status' | 'source'>) => {
    const newCluster: Cluster = {
      ...clusterData,
      id: `cluster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      status: 'Provisioning',
      source: 'User Cloud',
    };
    setClusters((prev) => [...prev, newCluster]);
  };

  return (
    <ClusterContext.Provider value={{ clusters, addCluster }}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useClusters() {
  const context = useContext(ClusterContext);
  if (context === undefined) {
    throw new Error('useClusters must be used within a ClusterProvider');
  }
  return context;
}
