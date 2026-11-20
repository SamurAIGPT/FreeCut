import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Grid, Maximize, ZoomIn, Film, Camera, Copy, Download, Check, CheckCircle2 } from 'lucide-react';
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

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClose);
      window.addEventListener('contextmenu', handleClose);
      window.addEventListener('resize', handleClose);
    }
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, [contextMenu]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveSnapshot = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `snapshot-${Math.round(playhead * 1000)}ms.png`;
      a.click();
      showToast('Snapshot saved as PNG');
    } catch {
      showToast('Could not save snapshot');
    }
  };

  const handleCopySnapshot = () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          showToast('Failed to create snapshot blob');
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Snapshot copied to clipboard');
        } catch {
          showToast('Clipboard access restricted');
        }
      });
    } catch {
      showToast('Could not copy snapshot');
    }
  };

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
      className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden bg-app-bg select-none transition-colors duration-200"
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
      <div 
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        className="flex flex-1 min-h-0 items-center justify-center p-4 pt-11 overflow-hidden cursor-default"
      >
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-app-border bg-app-surface/95 px-3.5 py-1.5 text-xs font-semibold text-app-text shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Preview Right-Click Context Menu */}
      {contextMenu && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            style={{
              position: 'fixed',
              left: Math.max(10, Math.min(window.innerWidth - 220, contextMenu.x)),
              top: Math.max(10, Math.min(window.innerHeight - 290, contextMenu.y)),
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-52 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-md text-neutral-900 dark:text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 mb-1">
              Preview Player
            </div>

            {/* Fit to screen */}
            <button
              onClick={() => {
                setCanvasZoom(0);
                setContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ZoomIn className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Fit to screen</span>
              </div>
              {canvasZoom === 0 && <Check className="h-3.5 w-3.5 text-blue-500" />}
            </button>

            {/* 50% Zoom */}
            <button
              onClick={() => {
                setCanvasZoom(50);
                setContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <span>50%</span>
              {canvasZoom === 50 && <Check className="h-3.5 w-3.5 text-blue-500" />}
            </button>

            {/* 75% Zoom */}
            <button
              onClick={() => {
                setCanvasZoom(75);
                setContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <span>75%</span>
              {canvasZoom === 75 && <Check className="h-3.5 w-3.5 text-blue-500" />}
            </button>

            {/* 100% Zoom */}
            <button
              onClick={() => {
                setCanvasZoom(100);
                setContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <span>100%</span>
              {canvasZoom === 100 && <Check className="h-3.5 w-3.5 text-blue-500" />}
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Fullscreen */}
            <button
              onClick={() => {
                handleToggleFullscreen();
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Maximize className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Full screen</span>
            </button>

            {/* Save snapshot */}
            <button
              onClick={() => {
                setContextMenu(null);
                handleSaveSnapshot();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Save snapshot</span>
            </button>

            {/* Copy snapshot */}
            <button
              onClick={() => {
                setContextMenu(null);
                handleCopySnapshot();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Copy snapshot</span>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Safe Area / Grid */}
            <button
              onClick={() => {
                toggleShowGrid();
                setContextMenu(null);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Grid className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>Safe Area / Grid</span>
              </div>
              {showGrid && <Check className="h-3.5 w-3.5 text-blue-500" />}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Transport Controls Bar */}
      <TransportBar />
    </div>
  );
};
