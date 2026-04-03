import { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, badge, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="font-['Manrope',sans-serif] text-lg font-semibold text-foreground">
            {title}
          </h2>
          {badge && (
            <span className="rounded bg-[#201f1f] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#f97316]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
