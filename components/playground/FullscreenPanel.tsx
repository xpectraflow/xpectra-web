"use client";

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export interface FullscreenPanelHandle {
  toggle: () => void;
  isFullscreen: boolean;
}

export const FullscreenPanel = forwardRef<
  FullscreenPanelHandle,
  { 
    children: React.ReactNode; 
    className?: string;
    hideTrigger?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
  }
>(({ children, className = "", hideTrigger = false, onFullscreenChange }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useImperativeHandle(ref, () => ({
    toggle: toggleFullscreen,
    isFullscreen
  }));

  useEffect(() => {
    const handler = () => {
      const active = !!document.fullscreenElement && document.fullscreenElement === containerRef.current;
      setIsFullscreen(active);
      onFullscreenChange?.(active);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [onFullscreenChange]);

  return (
    <div 
      ref={containerRef} 
      className={`relative group bg-[#0e0e0e] ${className} ${
        isFullscreen ? "p-8 w-screen h-screen flex flex-col overflow-hidden" : ""
      }`}
    >
      {!hideTrigger && (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className={`absolute top-3 right-3 z-50 p-1.5 rounded-md bg-[#1c1b1b]/80 border border-[#27272a] text-muted-foreground hover:text-[#f97316] hover:bg-[#27272a] transition-all opacity-0 group-hover:opacity-100 ${
            isFullscreen ? "opacity-100 fixed top-8 right-8" : ""
          }`}
          title={isFullscreen ? "Exit Fullscreen" : "Focus Mode (Fullscreen)"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      )}
      
      <div className={isFullscreen ? "flex-1 flex flex-col min-h-0" : ""}>
        {children}
      </div>
    </div>
  );
});

FullscreenPanel.displayName = "FullscreenPanel";
