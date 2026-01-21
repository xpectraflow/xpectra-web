'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
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
          ? 'bg-gray-800 text-white'
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300">
          {count}
        </span>
      )}
    </Link>
  );
}
