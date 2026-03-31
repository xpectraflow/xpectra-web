'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentType } from "react";

interface SidebarItemProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}

export function SidebarItem({
  href,
  icon: Icon,
  label,
  count,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="rounded-full bg-sidebar-accent px-2 py-0.5 text-xs font-medium text-sidebar-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
