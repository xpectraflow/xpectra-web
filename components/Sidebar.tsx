'use client';

import {
  Rocket,
  House,
  BarChart3,
  Database,
  Users,
  Globe,
  Server,
  Briefcase,
  Zap,
  HelpCircle,
  BookOpen,
  MessageCircle,
  LogOut,
  FlaskConical,
  Activity,
} from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SidebarItem } from './SidebarItem';
import { useDevices } from '@/contexts/DeviceContext';
import { signOut, useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';

export function Sidebar() {
  const { devices } = useDevices();
  const { data: session } = useSession();
  const pathname = usePathname();
  const showOrgOnly =
    typeof pathname === 'string' && pathname.startsWith('/organizations');

  const organizationsQuery = trpc.organizations.list.useQuery();
  const organizations = organizationsQuery.data ?? [];

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Top Section */}
      <div className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-9 overflow-hidden rounded-lg">
            <Image
              src="/logo.svg"
              alt="Xpectra logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-lg font-semibold text-sidebar-accent-foreground">
            Xpectra
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {showOrgOnly ? (
          <div className="space-y-4">
            <div className="px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
              Organizations
            </div>
            {organizationsQuery.isLoading ? (
              <p className="px-3 text-xs text-muted-foreground">Loading…</p>
            ) : organizations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground">
                No organizations yet. Create one on the right.
              </div>
            ) : (
              organizations.map((org) => (
                <SidebarItem
                  key={org.id}
                  href="/organizations/setup"
                  icon={Users}
                  label={org.name}
                />
              ))
            )}
            <SidebarItem
              href="/organizations/setup"
              icon={Users}
              label="Create organization"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="mb-4">
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
                Home
              </div>
              <SidebarItem href="/" icon={House} label="Dashboard" />
              <SidebarItem href="/quickstart" icon={Rocket} label="Quickstart" />
              <SidebarItem href="/usage" icon={BarChart3} label="Usage" />
            </div>

            <div className="mb-4">
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
                Datasets
              </div>
              <SidebarItem href="/sensors" icon={Activity} label="Sensors" />
              <SidebarItem
                href="/experiments"
                icon={FlaskConical}
                label="Experiments"
              />
              <SidebarItem
                href="/datasets"
                icon={Database}
                label="My datasets"
                count={devices.length}
              />
              <SidebarItem
                href="/datasets/shared"
                icon={Users}
                label="Shared with me"
              />
              <SidebarItem
                href="/datasets/open"
                icon={Globe}
                label="Open data"
                count={2}
              />
            </div>

            <div className="mb-4">
              <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
                Workflows
              </div>
              <SidebarItem href="/clusters" icon={Server} label="Clusters" />
              <SidebarItem href="/jobs" icon={Briefcase} label="Jobs" />
              <SidebarItem href="/automations" icon={Zap} label="Automations" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      {showOrgOnly ? (
        <div className="border-t border-sidebar-border p-4">
          <div className="space-y-2">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {session?.user?.name ?? "Signed in user"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground">
              {session?.user?.email ?? "Local account"}
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-sidebar-border p-4">
          <div className="mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {session?.user?.name ?? "Signed in user"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground">
              {session?.user?.email ?? "Local account"}
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-input px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>

          <div className="space-y-1">
            <SidebarItem href="/support" icon={HelpCircle} label="Support" />
            <SidebarItem href="/docs" icon={BookOpen} label="Docs" />
            <SidebarItem href="/discord" icon={MessageCircle} label="Discord" />
          </div>
        </div>
      )}
    </div>
  );
}
