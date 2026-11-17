import React, { useEffect, useRef } from 'react';
import { Grid, Maximize, ZoomIn } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compositor } from '@/engine/compositor';
import { AspectRatio } from '@/types/editor';
import { TransportBar } from './TransportBar';

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const playhead = useEditorStore((s) => s.playhead);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleShowGrid = useEditorStore((s) => s.toggleShowGrid);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);

  useEffect(() => {
    if (canvasRef.current) {
      compositor.render(canvasRef.current, playhead, aspect, tracks, clips, assets, showGrid);
    }
  }, [playhead, aspect, tracks, clips, assets, showGrid]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const getAspectClass = () => {
    switch (aspect) {
      case '9:16':
        return 'aspect-[9/16] max-h-[82%]';
      case '1:1':
        return 'aspect-square max-h-[82%]';
      case '4:5':
        return 'aspect-[4/5] max-h-[82%]';
      case '21:9':
        return 'aspect-[21/9] max-w-[90%] max-h-[82%]';
      case '16:9':
      default:
        return 'aspect-video max-w-[90%] max-h-[82%]';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 flex-col overflow-hidden bg-app-bg select-none transition-colors duration-200"
    >
      {/* Floating Viewport HUD */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Aspect Ratio Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface/90 px-2.5 py-1 text-xs text-app-text backdrop-blur-md shadow-sm">
          <span className="text-[10px] text-app-text-muted font-medium">Ratio:</span>
          <select
            value={aspect}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent font-medium text-app-text focus:outline-none cursor-pointer"
          >
            <option value="16:9" className="bg-app-surface">16:9 Landscape</option>
            <option value="9:16" className="bg-app-surface">9:16 Shorts/Reels</option>
            <option value="1:1" className="bg-app-surface">1:1 Square</option>
            <option value="4:5" className="bg-app-surface">4:5 Portrait</option>
            <option value="21:9" className="bg-app-surface">21:9 UltraWide</option>
          </select>
        </div>

        {/* Viewport Scale & Grid & Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-app-border bg-app-surface/90 p-1 text-xs text-app-text backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-1 px-1.5">
            <ZoomIn className="h-3.5 w-3.5 text-app-text-muted" />
            <select
              value={canvasZoom}
              onChange={(e) => setCanvasZoom(Number(e.target.value))}
              className="bg-transparent text-[11px] font-medium text-app-text focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-app-surface">Fit</option>
              <option value={50} className="bg-app-surface">50%</option>
              <option value={75} className="bg-app-surface">75%</option>
              <option value={100} className="bg-app-surface">100%</option>
            </select>
          </div>

          <div className="h-3.5 w-px bg-app-border" />

          {/* Grid Toggle */}
          <button
            onClick={toggleShowGrid}
            title="Toggle Safe Margins / Grid"
            className={`rounded-lg p-1.5 transition ${
              showGrid
                ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-semibold'
                : 'text-app-text-muted hover:bg-app-elevated hover:text-app-text'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="flex flex-1 items-center justify-center p-6 pt-12 overflow-hidden">
        <div
          style={
            canvasZoom > 0
              ? { transform: `scale(${canvasZoom / 100})`, transformOrigin: 'center center' }
              : undefined
          }
          className={`relative flex items-center justify-center rounded-xl border border-app-border bg-black shadow-2xl overflow-hidden transition-transform duration-200 ${getAspectClass()}`}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Transport Controls Bar */}
      <TransportBar />
    </div>
  );
};
