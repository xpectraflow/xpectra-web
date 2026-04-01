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
  const [clusters, setClusters] = useState<Cluster[]>(() => {
    if (typeof window === 'undefined') {
      return defaultClusters;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultClusters;
    }

    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return defaultClusters;
      }

      const userClusters = parsed.filter((cluster): cluster is Cluster => {
        if (!cluster || typeof cluster !== 'object') {
          return false;
        }
        const candidate = cluster as Partial<Cluster>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.name === 'string' &&
          typeof candidate.provider === 'string' &&
          typeof candidate.region === 'string' &&
          typeof candidate.computeType === 'string' &&
          typeof candidate.workload === 'string' &&
          typeof candidate.status === 'string' &&
          typeof candidate.source === 'string'
        );
      });

      return [...defaultClusters, ...userClusters];
    } catch (error) {
      console.error('Failed to parse stored clusters:', error);
      return defaultClusters;
    }
  });

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
