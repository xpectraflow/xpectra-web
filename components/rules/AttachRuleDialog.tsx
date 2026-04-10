'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { X, Check, Box, Search } from 'lucide-react';

interface AttachRuleDialogProps {
  rule: {
    id: string;
    name: string;
  };
  onClose: () => void;
}

export function AttachRuleDialog({ rule, onClose }: AttachRuleDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const utils = trpc.useUtils();

  const experimentsQuery = trpc.experiments.getExperiments.useQuery();
  const updateMutation = trpc.experiments.updateRuleAssociations.useMutation();

  // Local state for toggles before saving
  const [localSelections, setLocalSelections] = useState<Set<string>>(new Set());
  const [initialSelections, setInitialSelections] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize local state from query data once
  if (experimentsQuery.data && !hasInitialized) {
    const initial = new Set<string>();
    experimentsQuery.data.forEach(exp => {
      if (exp.ruleIds.includes(rule.id)) initial.add(exp.id);
    });
    setLocalSelections(new Set(initial));
    setInitialSelections(initial);
    setHasInitialized(true);
  }

  const filteredExperiments = experimentsQuery.data?.filter((exp) =>
    exp.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const handleToggleLocal = (experimentId: string) => {
    setLocalSelections((prev) => {
      const next = new Set(prev);
      if (next.has(experimentId)) next.delete(experimentId);
      else next.add(experimentId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const experiments = experimentsQuery.data ?? [];

      // Identify what changed
      const updates = experiments.filter(exp => {
        const wasAttached = initialSelections.has(exp.id);
        const isAttached = localSelections.has(exp.id);
        return wasAttached !== isAttached;
      });

      if (updates.length === 0) {
        onClose();
        return;
      }

      await Promise.all(updates.map(exp => {
        const isCurrentlyAttached = localSelections.has(exp.id);
        const newRuleIds = isCurrentlyAttached
          ? Array.from(new Set([...exp.ruleIds, rule.id]))
          : exp.ruleIds.filter(id => id !== rule.id);

        return updateMutation.mutateAsync({
          id: exp.id,
          ruleIds: newRuleIds,
        });
      }));

      toast.success(`Updated assignments for ${updates.length} experiments`);
      await utils.experiments.getExperiments.invalidate();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Attach to Experiments</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Linked rule: <span className="text-primary font-medium">{rule.name}</span></p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-10 pr-4 text-sm focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {experimentsQuery.isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground italic">Loading experiments...</div>
            ) : filteredExperiments.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">No experiments found.</div>
            ) : (
              filteredExperiments.map((exp) => {
                const isAttached = localSelections.has(exp.id);
                return (
                  <div
                    key={exp.id}
                    onClick={() => handleToggleLocal(exp.id)}
                    className={`group flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all hover:shadow-md ${isAttached
                      ? 'border-primary/30 bg-primary/5 shadow-inner'
                      : 'border-border bg-muted/10 hover:border-primary/20'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${isAttached ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Box className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isAttached ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {exp.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {isAttached ? 'Will be attached' : `${exp.ruleIds.length} active rules`}
                        </p>
                      </div>
                    </div>

                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${isAttached
                      ? 'border-primary bg-primary text-primary-foreground scale-110'
                      : 'border-muted-foreground/30 text-transparent group-hover:border-primary/50'
                      }`}>
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-5 bg-muted/5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasInitialized}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {saving ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving...
              </>
            ) : (
              'Done'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}