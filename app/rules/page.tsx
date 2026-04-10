'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Search, Plus, Shield, Activity, Settings, Edit3, Trash2, FlaskConical } from 'lucide-react';
import { CreateRuleDialog } from '@/components/rules/CreateRuleDialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const rulesQuery = trpc.rules.getRules.useQuery();

  const deleteMutation = trpc.rules.deleteRule.useMutation({
    onSuccess: () => {
      toast.success('Policy deleted');
      utils.rules.getRules.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredRules = rulesQuery.data?.filter((rule) =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'STATISTICAL': return <Activity className="h-4 w-4 text-sky-400" />;
      case 'THRESHOLD': return <Settings className="h-4 w-4 text-[#f97316]" />;
      case 'AVAILABILITY': return <Shield className="h-4 w-4 text-emerald-400" />;
      default: return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <PageLayout
      title="Rules"
      description="Manage telemetry validation rules and attach them to experiments."
      action={  
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 shadow-lg shadow-primary/10"
        >
          <Plus className="h-4 w-4" />
          New rule
        </button>
      }
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search policies by name or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f97316]/50 focus:outline-none focus:ring-4 focus:ring-[#f97316]/10 transition-all font-['Manrope',sans-serif]"
          />
        </div>

        {/* Policies List */}
        {rulesQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Fetching policies...</p>
            </div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-20 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/20" />
            <p className="mt-4 text-sm text-muted-foreground">No policies found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Policy Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Scope</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-1.5 ${rule.isManaged ? 'bg-[#1c1b1b]' : 'bg-muted/30'}`}>
                          {getIcon(rule.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rule.name}</p>
                          {rule.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {rule.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {rule.type === 'STATISTICAL' && `${(rule.config as any).stdDevMultiplier}σ`}
                      {rule.type === 'THRESHOLD' && `${(rule.config as any).min ?? '-'}-${(rule.config as any).max ?? '-'}`}
                      {rule.type === 'AVAILABILITY' && (rule.config as any).maxGapSeconds ? `${(rule.config as any).maxGapSeconds}s` : 'Pulse'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${rule.isManaged
                            ? "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          }`}
                      >
                        {rule.isManaged ? "Managed" : "Custom"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(rule.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {!rule.isManaged && (
                          <>
                            <button className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate({ id: rule.id })}
                              disabled={deleteMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive-foreground transition hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deleteMutation.isPending ? "..." : "Delete"}
                            </button>
                          </>
                        )}
                        {rule.isManaged && (
                          <span className="text-[10px] text-muted-foreground/30 font-medium italic">Read-only template</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isDialogOpen && <CreateRuleDialog onClose={() => setIsDialogOpen(false)} />}
    </PageLayout>
  );
}



