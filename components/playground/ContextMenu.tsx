"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

export type ContextMenuItem =
  | {
      type: "item";
      label: string;
      icon?: ReactNode;
      onClick: () => void;
      variant?: "default" | "destructive";
    }
  | { type: "separator" };

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Adjust position so menu stays in viewport
  const adjustedX = Math.min(x, window.innerWidth - 192);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-[9999] min-w-48 overflow-hidden rounded-md border border-[#27272a] bg-[#1c1b1b] py-1 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      {items.map((item, i) => {
        if (item.type === "separator") {
          return <div key={i} className="my-1 border-t border-[#27272a]" />;
        }

        const isDestructive = item.variant === "destructive";

        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
              isDestructive
                ? "text-[#dc2626] hover:bg-[#dc2626]/10"
                : "text-foreground hover:bg-[#27272a]"
            }`}
          >
            {item.icon && (
              <span className={`shrink-0 ${isDestructive ? "text-[#dc2626]" : "text-muted-foreground"}`}>
                {item.icon}
              </span>
            )}
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return typeof window !== "undefined" ? createPortal(menu, document.body) : null;
}

/* ─── Hook to manage context menu state ────────────────────────────────────── */

import { useState, useCallback } from "react";

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const open = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, items });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  return { menu, open, close };
}
