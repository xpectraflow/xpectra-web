import { ReactNode } from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PageLayout({
  title,
  description,
  children,
  action,
}: PageLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
