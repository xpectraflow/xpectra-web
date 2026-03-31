"use client";

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
  Search,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem';
import { useDevices } from '@/contexts/DeviceContext';
import { signOut, useSession } from "next-auth/react";

export function Sidebar() {
  const { devices } = useDevices();
  const { data: session } = useSession();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Top Section */}
      <div className="border-b border-sidebar-border p-4">
        <div className="mb-4">
          <div className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground">
            Workspace
          </div>
          <div className="mt-1 text-sm font-medium text-sidebar-accent-foreground">
            Personal Workspace
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
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
            <SidebarItem
              href="/experiments"
              icon={FlaskConical}
              label="Experiments"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
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
    </div>
  );
}
