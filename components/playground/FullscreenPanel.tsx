"use client";

import React, { useRef, useState, useEffect } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export function FullscreenPanel({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`relative group bg-[#0e0e0e] ${className} ${
        isFullscreen ? "p-8 w-screen h-screen flex flex-col overflow-hidden" : ""
      }`}
    >
      <button
        onClick={toggleFullscreen}
        className={`absolute top-3 right-3 z-50 p-1.5 rounded-md bg-[#1c1b1b]/80 border border-[#27272a] text-muted-foreground hover:text-[#f97316] hover:bg-[#27272a] transition-all opacity-0 group-hover:opacity-100 ${
          isFullscreen ? "opacity-100 fixed top-8 right-8" : ""
        }`}
        title={isFullscreen ? "Exit Fullscreen" : "Focus Mode (Fullscreen)"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      
      <div className={isFullscreen ? "flex-1 flex flex-col min-h-0" : ""}>
        {children}
      </div>
    </div>
  );
}
