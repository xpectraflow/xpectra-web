'use client';

interface UsageCardProps {
  title: string;
  subtitle: string;
  value: string;
  footer: string;
  progress: number; // 0-100
  variant?: 'default' | 'accent' | 'unlimited';
}

export function UsageCard({
  title,
  subtitle,
  value,
  footer,
  progress,
  variant = 'default',
}: UsageCardProps) {
  const isUnlimited = variant === 'unlimited';
  const showProgress = !isUnlimited && progress > 0;
  const isAccent = variant === 'accent';

  // Calculate stroke-dasharray for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-lg border border-border bg-card/50 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative mx-auto mb-4 flex h-40 w-40 items-center justify-center">
        {/* Circular indicator */}
        <svg
          className="h-40 w-40 -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={
              isUnlimited
                ? '#374151'
                : isAccent
                ? '#1e40af'
                : '#374151'
            }
            strokeWidth="8"
            className="opacity-20"
          />
          {/* Progress circle */}
          {showProgress && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={isAccent ? '#3b82f6' : '#6b7280'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all"
            />
          )}
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-semibold text-foreground">{value}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}

