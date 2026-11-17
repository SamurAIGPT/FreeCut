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

  // Render on updates
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

  // Compute aspect ratio CSS class
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
      className="relative flex flex-1 flex-col overflow-hidden bg-[#07080b]"
    >
      {/* Floating Viewport Toolbar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Aspect Ratio Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-[#232938]/80 bg-[#0d0f14]/80 px-2.5 py-1 text-xs text-slate-300 backdrop-blur-md shadow-lg">
          <span className="text-[10px] text-slate-500 font-medium">Ratio:</span>
          <select
            value={aspect}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
          >
            <option value="16:9" className="bg-[#12141a]">16:9 Landscape</option>
            <option value="9:16" className="bg-[#12141a]">9:16 Shorts/Reels</option>
            <option value="1:1" className="bg-[#12141a]">1:1 Square</option>
            <option value="4:5" className="bg-[#12141a]">4:5 Portrait</option>
            <option value="21:9" className="bg-[#12141a]">21:9 UltraWide</option>
          </select>
        </div>

        {/* Right Viewport Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-[#232938]/80 bg-[#0d0f14]/80 p-1 text-xs text-slate-300 backdrop-blur-md shadow-lg">
          {/* Zoom % */}
          <div className="flex items-center gap-1 px-1.5">
            <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={canvasZoom}
              onChange={(e) => setCanvasZoom(Number(e.target.value))}
              className="bg-transparent text-[11px] font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value={0} className="bg-[#12141a]">Fit</option>
              <option value={50} className="bg-[#12141a]">50%</option>
              <option value={75} className="bg-[#12141a]">75%</option>
              <option value={100} className="bg-[#12141a]">100%</option>
            </select>
          </div>

          <div className="h-3.5 w-px bg-[#232938]" />

          {/* Grid Toggle */}
          <button
            onClick={toggleShowGrid}
            title="Toggle Safe Margins / Grid"
            className={`rounded-lg p-1.5 transition ${
              showGrid
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-slate-400 hover:bg-[#1a1f2b] hover:text-white'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-[#1a1f2b] hover:text-white transition"
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
          className={`relative flex items-center justify-center rounded-xl border border-[#232938] bg-[#000000] shadow-2xl shadow-black overflow-hidden transition-transform duration-200 ${getAspectClass()}`}
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
