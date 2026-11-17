import React, { useEffect, useRef } from 'react';
import { Grid, Maximize, ZoomIn, Film } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compositor } from '@/engine/compositor';
import { AspectRatio } from '@/types/editor';
import { TransportBar } from './TransportBar';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

const ASPECT_OPTIONS: SelectOption<AspectRatio>[] = [
  { value: '16:9', label: '16:9 Landscape', description: 'YouTube & Desktop standard' },
  { value: '9:16', label: '9:16 Shorts / Reels', description: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 Square', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5 Portrait', description: 'Social Feed' },
  { value: '21:9', label: '21:9 UltraWide', description: 'Cinematic CinemaScope' },
];

const ZOOM_OPTIONS: SelectOption<number>[] = [
  { value: 0, label: 'Fit' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
];

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
        {/* Aspect Ratio Custom Select */}
        <div className="pointer-events-auto">
          <CustomSelect<AspectRatio>
            value={aspect}
            onChange={(val) => setAspectRatio(val)}
            options={ASPECT_OPTIONS}
            size="sm"
            prefix="Ratio:"
            icon={<Film className="h-3 w-3" />}
            className="w-44"
          />
        </div>

        {/* Viewport Scale & Grid & Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-app-border bg-app-surface/90 p-1 text-xs text-app-text backdrop-blur-md shadow-sm">
          <CustomSelect<number>
            value={canvasZoom}
            onChange={(val) => setCanvasZoom(val)}
            options={ZOOM_OPTIONS}
            size="sm"
            icon={<ZoomIn className="h-3 w-3" />}
            className="w-24"
          />

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
