import { ReactNode } from "react";

interface ChartPanelProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
  minHeight?: number;
}

export function ChartPanel({
  title,
  subtitle,
  badge,
  children,
  className = "",
  minHeight = 200,
}: ChartPanelProps) {
  return (
    <div className={`rounded bg-[#1c1b1b] p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-['Manrope',sans-serif] text-sm font-semibold text-foreground">
              {title}
            </span>
            {badge && (
              <span className="rounded bg-[#131313] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ minHeight }}>{children}</div>
    </div>
  );
}
