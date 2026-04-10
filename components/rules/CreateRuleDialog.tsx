"use client";

import { useState } from 'react';
import { Shield, Activity, Settings, FlaskConical, X, Plus, Info } from 'lucide-react';

interface CreateRuleDialogProps {
  onClose: () => void;
}

const PRESETS = [
  {
    name: '3-Sigma Outlier',
    type: 'STATISTICAL',
    description: 'Data points outside 3x standard deviation.',
    params: { stdDevMultiplier: 3 }
  },
  {
    name: 'Safety Ceiling',
    type: 'THRESHOLD',
    description: 'Fixed maximum limit for safety.',
    params: { max: 100 }
  },
  {
    name: 'Flatline Alarm',
    type: 'AVAILABILITY',
    description: 'Alert if signal has zero variance.',
    params: {}
  }
];

export function CreateRuleDialog({ onClose }: CreateRuleDialogProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'THRESHOLD',
    params: { min: 0, max: 100, stdDevMultiplier: 3 },
    assignedExperiments: [] as string[]
  });

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFormData({
      ...formData,
      name: preset.name,
      type: preset.type,
      description: preset.description,
      params: { ...formData.params, ...preset.params }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-['Manrope',sans-serif] text-lg font-bold text-foreground leading-none">Create Policy</h2>
              <p className="mt-1 text-xs text-muted-foreground">Define constraints for your telemetry data</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-8 flex items-center justify-between px-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-[#1c1b1b] text-muted-foreground'
                }`}>
                  {s}
                </div>
                <span className={`text-xs font-medium ${step >= s ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                  {s === 1 ? 'Definition' : s === 2 ? 'Conditions' : 'Assignment'}
                </span>
                {s < 3 && <div className="mx-2 h-[1px] w-12 bg-border"></div>}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-3 gap-3">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex flex-col items-start gap-2 rounded-xl border border-border bg-[#121212] p-4 text-left transition hover:border-primary/50 hover:bg-[#1c1b1b]"
                  >
                    <Info className="h-4 w-4 text-primary/50" />
                    <span className="text-[11px] font-bold text-foreground">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground/70 leading-tight">{p.description}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Policy Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Engine Temperature Safety"
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm ring-primary/20 transition focus:border-primary focus:outline-none focus:ring-4"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm ring-primary/20 transition focus:border-primary focus:outline-none focus:ring-4"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Rule Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['THRESHOLD', 'STATISTICAL', 'AVAILABILITY'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t as any })}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                        formData.type === t ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-[#121212] text-muted-foreground'
                      }`}
                    >
                      {t === 'THRESHOLD' && <Settings className="h-4 w-4" />}
                      {t === 'STATISTICAL' && <Activity className="h-4 w-4" />}
                      {t === 'AVAILABILITY' && <Shield className="h-4 w-4" />}
                      <span className="text-[10px] font-bold">{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-6">
                {formData.type === 'THRESHOLD' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Min (Low)</label>
                      <input type="number" className="w-full rounded bg-background border border-border px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Max (High)</label>
                      <input type="number" className="w-full rounded bg-background border border-border px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
                {formData.type === 'STATISTICAL' && (
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="text-xl font-bold">{formData.params.stdDevMultiplier}x</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Std Dev Multiplier (σ)</label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="0.5"
                        value={formData.params.stdDevMultiplier}
                        onChange={e => setFormData({ ...formData, params: { ...formData.params, stdDevMultiplier: parseFloat(e.target.value) } })}
                        className="w-full"
                      />
                      <p className="text-[11px] text-muted-foreground">Alert when value exceeds {formData.params.stdDevMultiplier} sigma from mean</p>
                    </div>
                  </div>
                )}
                {formData.type === 'AVAILABILITY' && (
                  <div className="text-center py-4">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">Monitors data stream continuity. Alerts on zero variance or data gaps.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Assign to Experiments</label>
              <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                {['Bridge Structural Load', 'Wind Tunnel 402', 'Propulsion Test Stand B', 'Thermal Cycling Unit'].map(exp => (
                  <label key={exp} className="flex items-center gap-3 rounded-lg border border-border bg-[#121212] px-4 py-3 cursor-pointer hover:bg-[#1c1b1b] transition">
                    <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20" />
                    <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{exp}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/30 px-6 py-4">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : onClose()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/50 transition hover:bg-primary/90 active:scale-95"
          >
            {step === 3 ? 'Finish & Create' : 'Next Step'}
          </button>
        </div>
      </div>
    </div>
  );
}
