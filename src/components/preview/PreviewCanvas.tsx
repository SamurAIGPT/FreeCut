import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Maximize, ZoomIn, Film, Copy, Download, Check, CheckCircle2, RotateCcw } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { compositor } from '@/engine/compositor';
import { AspectRatio } from '@/types/editor';
import { TransportBar } from './TransportBar';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { GuidePopover } from './GuidePopover';
import { GridGuide, TikTokGuide, InstagramReelsGuide, YouTubeShortsGuide } from './SocialGuides';
import { TransformOverlay } from './TransformOverlay';

const ASPECT_OPTIONS: SelectOption<AspectRatio>[] = [
  { value: '16:9', label: '16:9 Landscape', description: 'YouTube & Desktop standard' },
  { value: '9:16', label: '9:16 Shorts / Reels', description: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 Square', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5 Portrait', description: 'Social Feed' },
  { value: '21:9', label: '21:9 UltraWide', description: 'Cinematic CinemaScope' },
];

const ZOOM_OPTIONS: SelectOption<number>[] = [
  { value: 0, label: 'Fit' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
];

export const PreviewCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const playhead = useEditorStore((s) => s.playhead);
  const aspect = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const assets = useEditorStore((s) => s.assets);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);
  const activeGuide = useEditorStore((s) => s.activeGuide || (s.showGrid ? 'grid' : 'none'));
  const gridConfig = useEditorStore((s) => s.gridConfig || { rows: 3, cols: 3 });

  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number } | null>(null);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reset pan when switching to Fit
  useEffect(() => {
    if (canvasZoom === 0) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [canvasZoom]);

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpaceHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse wheel zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.15 : 0.85;
      const current = canvasZoom === 0 ? 100 : canvasZoom;
      const nextZoom = Math.max(25, Math.min(300, Math.round(current * factor)));
      setCanvasZoom(nextZoom);
    } else if (canvasZoom > 0 && !isSpaceHeld) {
      // Pan via trackpad / mousewheel
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Viewport Pan Pointer Down (Space+LeftClick OR MiddleClick)
  const handleViewportPointerDown = (e: React.PointerEvent) => {
    const isMiddleClick = e.button === 1;
    const isSpacePan = e.button === 0 && isSpaceHeld;

    if (isMiddleClick || isSpacePan) {
      e.preventDefault();
      e.stopPropagation();

      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialX: panOffset.x,
        initialY: panOffset.y,
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!panStartRef.current) return;
        const dx = moveEvent.clientX - panStartRef.current.clientX;
        const dy = moveEvent.clientY - panStartRef.current.clientY;
        setPanOffset({
          x: panStartRef.current.initialX + dx,
          y: panStartRef.current.initialY + dy,
        });
      };

      const handlePointerUp = () => {
        setIsPanning(false);
        panStartRef.current = null;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
  };

  // Context menu close listener
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

  // Render compositor output onto canvas
  useEffect(() => {
    if (canvasRef.current) {
      // When React guide overlays are active, canvas itself renders clean content
      compositor.render(canvasRef.current, playhead, aspect, tracks, clips, assets, false);
    }
  }, [playhead, aspect, tracks, clips, assets]);

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
      <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        {/* Aspect Ratio Custom Select */}
        <div className="pointer-events-auto">
          <CustomSelect<AspectRatio>
            value={aspect}
            onChange={(val) => setAspectRatio(val)}
            options={ASPECT_OPTIONS}
            size="sm"
            prefix="Ratio:"
            icon={<Film className="h-3 w-3" />}
            className="w-44 shadow-sm"
          />
        </div>

        {/* Viewport Scale & Guides & Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-app-border bg-app-surface/90 p-1 text-xs text-app-text backdrop-blur-md shadow-sm">
          {/* Zoom Select */}
          <CustomSelect<number>
            value={canvasZoom}
            onChange={(val) => setCanvasZoom(val)}
            options={ZOOM_OPTIONS}
            size="sm"
            icon={<ZoomIn className="h-3 w-3" />}
            className="w-24"
          />

          <div className="h-3.5 w-px bg-app-border" />

          {/* Guides Popover */}
          <GuidePopover />

          <div className="h-3.5 w-px bg-app-border" />

          {/* Fullscreen */}
          <button
            onClick={handleToggleFullscreen}
            title="Toggle Fullscreen"
            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame with Smooth Pan & Zoom */}
      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handleViewportPointerDown}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        className={`flex flex-1 min-h-0 items-center justify-center p-4 pt-11 overflow-hidden ${
          isPanning ? 'cursor-grabbing' : isSpaceHeld ? 'cursor-grab' : 'cursor-default'
        }`}
      >
        <div
          style={{
            transform:
              canvasZoom > 0
                ? `translate(${panOffset.x}px, ${panOffset.y}px) scale(${canvasZoom / 100})`
                : undefined,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className={`relative flex items-center justify-center ${getAspectClass()}`}
        >
          {/* Inner rounded container with overflow-hidden for the video canvas & guides */}
          <div className="relative h-full w-full rounded-xl border border-app-border bg-black shadow-2xl overflow-hidden flex items-center justify-center">
            {/* Output Video Canvas */}
            <canvas
              ref={canvasRef}
              className="h-full w-full object-contain pointer-events-none"
            />

            {/* Social Platform Safe Zones & Rule of Thirds Guides */}
            {activeGuide === 'grid' && <GridGuide config={gridConfig} />}
            {activeGuide === 'tiktok' && <TikTokGuide aspectRatio={aspect} />}
            {activeGuide === 'reels' && <InstagramReelsGuide aspectRatio={aspect} />}
            {activeGuide === 'shorts' && <YouTubeShortsGuide aspectRatio={aspect} />}
          </div>

          {/* Interactive Transform Handles & Direct Selection Overlay (overflow-visible so rotation handle is never clipped) */}
          <div className="absolute inset-0 overflow-visible pointer-events-none">
            <TransformOverlay canvasRef={canvasRef} />
          </div>
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
              top: Math.max(10, Math.min(window.innerHeight - 340, contextMenu.y)),
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-1.5 shadow-2xl backdrop-blur-md text-neutral-900 dark:text-neutral-100 select-none animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 mb-1">
              Viewport & Canvas
            </div>

            {/* Fit to screen */}
            <button
              onClick={() => {
                setCanvasZoom(0);
                setPanOffset({ x: 0, y: 0 });
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

            {/* Reset Pan & Zoom */}
            <button
              onClick={() => {
                setCanvasZoom(0);
                setPanOffset({ x: 0, y: 0 });
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Reset Pan & Center</span>
            </button>

            <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Zoom presets */}
            {[25, 50, 75, 100, 150, 200].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setCanvasZoom(preset);
                  setContextMenu(null);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <span>{preset}%</span>
                {canvasZoom === preset && <Check className="h-3.5 w-3.5 text-blue-500" />}
              </button>
            ))}

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
              <span>Toggle Fullscreen</span>
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
              <span>Save snapshot (PNG)</span>
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
          </div>
        </div>,
        document.body
      )}

      {/* Transport Controls Bar */}
      <TransportBar />
    </div>
  );
};
