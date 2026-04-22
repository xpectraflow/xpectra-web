'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Plus, Search, Database, Loader2, Gamepad, Eye, Code, X, Copy } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Link from "next/link";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DatasetsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDatasetForCode, setSelectedDatasetForCode] = useState<{name: string, id: string, experimentId: string} | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { data: datasets = [], isLoading } = trpc.datasets.getAllDatasets.useQuery();

  const filteredDatasets = datasets.filter(
    (ds) =>
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.experimentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return "bg-green-500/10 text-green-600 border-green-500/30";
      case 'running': return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case 'failed': return "bg-destructive/10 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <PageLayout
      title="Datasets"
      description="All telemetry datasets across your experiments."
      action={
        <Link
          href="/datasets/create"
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create dataset
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-input focus:outline-none transition-all"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Fetching datasets...</p>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {datasets.length === 0
                ? "No datasets yet. Create a dataset through the client."
                : "No datasets match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Experiment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Datapoints</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDatasets.map((ds) => (
                  <tr key={ds.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/experiments/${ds.experimentId}/datasets/${ds.id}`}
                        className="font-medium text-card-foreground transition hover:text-primary"
                      >
                        {ds.name}
                      </Link>
                      <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
                        {format(new Date(ds.createdAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Database className="h-3 w-3" />
                        {ds.experimentName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          getStatusBadge(ds.status)
                        )}
                      >
                        {ds.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                      {(ds.rowCount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/experiments/${ds.experimentId}/datasets/${ds.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                        <Link
                          href={`/playground?experimentId=${ds.experimentId}&datasetId=${ds.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs text-primary transition hover:bg-primary/10"
                        >
                          <Gamepad className="h-3.5 w-3.5" /> Playground
                        </Link>
                        <button
                          onClick={() => setSelectedDatasetForCode(ds)}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                        >
                          <Code className="h-3.5 w-3.5" /> Code
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDatasetForCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Load Dataset via Python
              </h3>
              <button
                onClick={() => {
                  setSelectedDatasetForCode(null);
                  setCopied(false);
                }}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-muted-foreground">
                Use the Xpectra Python client to load this dataset programmatically.
              </div>
              <div className="relative overflow-hidden rounded-lg border border-border bg-[#1E1E1E]">
                <div className="flex items-center justify-between border-b border-white/10 bg-[#252526] px-4 py-2">
                  <span className="text-xs font-medium text-white/70">Python</span>
                  <button
                    onClick={() => {
                      const code = `from xpectra.datasets import Client\nclient = Client()\ndataset = client.datasets(data="${selectedDatasetForCode.name}", experiment_id="${selectedDatasetForCode.experimentId}")\n\ndata = dataset.load()`;
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Copy className="h-3 w-3" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="overflow-x-auto p-4 text-sm text-[#D4D4D4] font-mono leading-relaxed">
                  <span className="text-[#C586C0]">from</span> xpectra.datasets <span className="text-[#C586C0]">import</span> Client
                  {'\n'}client = Client()
                  {'\n'}dataset = client.datasets(data=<span className="text-[#CE9178]">"{selectedDatasetForCode.name}"</span>, experiment_id=<span className="text-[#CE9178]">"{selectedDatasetForCode.experimentId}"</span>)
                  {'\n\n'}data = dataset.load()
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
