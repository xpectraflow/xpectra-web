"use client";

import { ReactElement } from "react";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

export type AlertSeverity = "high" | "medium" | "low";

interface AlertRuleProps {
  name: string;
  condition: string;
  channel: string;
  severity?: AlertSeverity;
  active?: boolean;
  onToggle?: () => void;
}

const SEVERITY_STYLES: Record<AlertSeverity, { text: string; bg: string; border: string }> = {
  high: {
    text: "text-[#dc2626]",
    bg: "bg-[#dc2626]/10",
    border: "border-[#dc2626]/20",
  },
  medium: {
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/20",
  },
  low: {
    text: "text-[#00a2f4]",
    bg: "bg-[#00a2f4]/10",
    border: "border-[#00a2f4]/20",
  },
};

const SEVERITY_ICONS: Record<AlertSeverity, ReactElement> = {
  high: <AlertTriangle className="h-3.5 w-3.5" />,
  medium: <TrendingUp className="h-3.5 w-3.5" />,
  low: <Zap className="h-3.5 w-3.5" />,
};

export function AlertRule({
  name,
  condition,
  channel,
  severity = "medium",
  active = true,
  onToggle,
}: AlertRuleProps) {
  const styles = SEVERITY_STYLES[severity];

  return (
    <div className="flex items-start gap-3 rounded bg-[#1c1b1b] p-3 transition-all hover:bg-[#201f1f]">
      <div className={`mt-0.5 rounded p-1.5 ${styles.bg} ${styles.border} border`}>
        <span className={styles.text}>{SEVERITY_ICONS[severity]}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full transition-colors ${
              active ? "bg-[#f97316]" : "bg-[#353534]"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                active ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{condition}</p>
        <span className="mt-1 inline-block rounded bg-[#131313] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {channel}
        </span>
      </div>
    </div>
  );
}
