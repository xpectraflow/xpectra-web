"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "healthy" | "warning" | "critical" | "idle";
  highlight?: boolean;
}

const STATUS_COLORS: Record<NonNullable<StatCardProps["status"]>, string> = {
  healthy: "text-[#00a2f4]",
  warning: "text-[#f59e0b]",
  critical: "text-[#dc2626]",
  idle: "text-muted-foreground",
};

const STATUS_DOT: Record<NonNullable<StatCardProps["status"]>, string> = {
  healthy: "bg-[#00a2f4]",
  warning: "bg-[#f59e0b]",
  critical: "bg-[#dc2626]",
  idle: "bg-muted-foreground",
};

const TREND_COLORS = {
  up: "text-[#16a34a]",
  down: "text-[#dc2626]",
  stable: "text-muted-foreground",
};

const TREND_ARROWS = { up: "↑", down: "↓", stable: "→" };

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  status,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded p-4 transition-all ${
        highlight
          ? "bg-[#201f1f] ring-1 ring-[#f97316]/30"
          : "bg-[#1c1b1b] hover:bg-[#201f1f]"
      }`}
    >
      {highlight && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f97316]/5 to-transparent" />
      )}

      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {status && (
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]} ${
                  status === "healthy" ? "animate-pulse" : ""
                }`}
              />
              <span className={`font-mono text-[10px] uppercase ${STATUS_COLORS[status]}`}>
                {status}
              </span>
            </span>
          )}
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-['Manrope',sans-serif] text-3xl font-bold text-foreground">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs text-muted-foreground">{unit}</span>
        )}
      </div>

      {trend && trendValue && (
        <div className={`mt-2 font-mono text-[11px] ${TREND_COLORS[trend]}`}>
          {TREND_ARROWS[trend]} {trendValue}
        </div>
      )}
    </div>
  );
}
