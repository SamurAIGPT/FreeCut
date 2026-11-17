import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, Music, Type, Scissors, Copy, Trash2, 
  Volume2, VolumeX, Eye, EyeOff, Link2, Sparkles, MoveHorizontal 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Clip } from '@/types/editor';
import { formatShortTime } from '@/utils/time';

interface ClipItemProps {
  clip: Clip;
  isLocked?: boolean;
}

export const ClipItem: React.FC<ClipItemProps> = ({ clip, isLocked }) => {
  const zoom = useEditorStore((s) => s.zoom);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const setSelectedClipId = useEditorStore((s) => s.setSelectedClipId);
  const updateClip = useEditorStore((s) => s.updateClip);
  const playhead = useEditorStore((s) => s.playhead);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const activeTool = useEditorStore((s) => s.activeTool);
  const splitClip = useEditorStore((s) => s.splitClip);
  const splitLeft = useEditorStore((s) => s.splitLeft);
  const splitRight = useEditorStore((s) => s.splitRight);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const extractAudio = useEditorStore((s) => s.extractAudio);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const moveClipToTrack = useEditorStore((s) => s.moveClipToTrack);
  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const markers = useEditorStore((s) => s.markers);
  const setSnapGuideX = useEditorStore((s) => s.setSnapGuideX);

  const [trimTooltip, setTrimTooltip] = useState<{ text: string; side: 'left' | 'right' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedClipId === clip.id;

  // Close context menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [contextMenu]);

  // Context Menu trigger
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedClipId(clip.id);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Drag Clip (Both Horizontally in Time & Vertically between Tracks)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    if (e.button !== 0) return; // Only primary button
    e.stopPropagation();

    if (activeTool === 'razor') {
      splitClip(clip.id);
      return;
    }

    setSelectedClipId(clip.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialStart = clip.start;
    const initialTrackId = clip.trackId;

    // Precalculate snap targets (playhead, markers, other clip starts & ends)
    const snapTargets = [
      playhead,
      ...markers.map((m) => m.time),
      ...clips.filter((c) => c.id !== clip.id).flatMap((c) => [c.start, c.start + c.duration]),
    ];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newStart = Math.max(0, initialStart + deltaX / zoom);

      // Magnetic Snapping
      if (isSnapping) {
        const snapThreshold = 10 / zoom; // 10px snap window
        let activeSnapPoint: number | null = null;

        for (const target of snapTargets) {
          // Snap clip start
          if (Math.abs(newStart - target) < snapThreshold) {
            newStart = target;
            activeSnapPoint = target;
            break;
          }
          // Snap clip end
          if (Math.abs(newStart + clip.duration - target) < snapThreshold) {
            newStart = Math.max(0, target - clip.duration);
            activeSnapPoint = target;
            break;
          }
        }

        setSnapGuideX(activeSnapPoint);
      }

      // Vertical Track Detection
      const deltaY = moveEvent.clientY - startY;
      if (Math.abs(deltaY) > 20) {
        // Find which track row the cursor is currently over
        const trackElements = document.querySelectorAll('[data-track-id]');
        for (let i = 0; i < trackElements.length; i++) {
          const el = trackElements[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          if (moveEvent.clientY >= rect.top && moveEvent.clientY <= rect.bottom) {
            const targetTrackId = el.getAttribute('data-track-id');
            if (targetTrackId && targetTrackId !== clip.trackId) {
              const targetTrack = tracks.find((t) => t.id === targetTrackId);
              // Check type compatibility
              if (
                targetTrack &&
                ((clip.type === 'audio' && targetTrack.type === 'audio') ||
                  (clip.type !== 'audio' && targetTrack.type !== 'audio'))
              ) {
                moveClipToTrack(clip.id, targetTrackId, newStart);
                return;
              }
            }
          }
        }
      }

      updateClip(clip.id, { start: newStart });
    };

    const onMouseUp = () => {
      setSnapGuideX(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trim Left Handle
  const handleTrimLeft = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = clip.start;
    const initialDuration = clip.duration;
    const initialTrimStart = clip.trimStart;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = deltaX / zoom;
      let newStart = Math.max(0, initialStart + timeDelta);
      let newDuration = Math.max(0.2, initialDuration - timeDelta);

      // Snap trim to playhead
      if (isSnapping && Math.abs(newStart - playhead) < 8 / zoom) {
        const diff = playhead - initialStart;
        newStart = playhead;
        newDuration = initialDuration - diff;
        setSnapGuideX(playhead);
      } else {
        setSnapGuideX(null);
      }

      if (newDuration > 0.2) {
        updateClip(clip.id, {
          start: newStart,
          duration: newDuration,
          trimStart: initialTrimStart + (newStart - initialStart),
        });
        setTrimTooltip({ text: `In: ${formatShortTime(newStart)} (Δ ${timeDelta >= 0 ? '+' : ''}${timeDelta.toFixed(1)}s)`, side: 'left' });
      }
    };

    const onMouseUp = () => {
      setSnapGuideX(null);
      setTrimTooltip(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trim Right Handle
  const handleTrimRight = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = clip.duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const timeDelta = deltaX / zoom;
      let newDuration = Math.max(0.2, initialDuration + timeDelta);

      // Snap trim to playhead
      if (isSnapping && Math.abs(clip.start + newDuration - playhead) < 8 / zoom) {
        newDuration = Math.max(0.2, playhead - clip.start);
        setSnapGuideX(playhead);
      } else {
        setSnapGuideX(null);
      }

      updateClip(clip.id, {
        duration: newDuration,
        trimEnd: clip.trimStart + newDuration,
      });
      setTrimTooltip({ text: `Out: ${formatShortTime(clip.start + newDuration)} (Δ ${timeDelta >= 0 ? '+' : ''}${timeDelta.toFixed(1)}s)`, side: 'right' });
    };

    const onMouseUp = () => {
      setSnapGuideX(null);
      setTrimTooltip(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const leftPos = clip.start * zoom;
  const clipWidth = Math.max(20, clip.duration * zoom);

  const getThemeStyles = () => {
    switch (clip.type) {
      case 'audio':
        return {
          bg: 'bg-[#8F5DBA] hover:bg-[#9b6bcc] text-white',
          border: 'border-[#a273cf]',
          icon: Music,
        };
      case 'text':
        return {
          bg: 'bg-[#5DBAA0] hover:bg-[#68c7ae] text-white',
          border: 'border-[#70cbb2]',
          icon: Type,
        };
      case 'video':
      default:
        return {
          bg: 'bg-slate-200 hover:bg-slate-100 text-slate-800 dark:bg-[#24252a] dark:hover:bg-[#2c2d34] dark:text-white',
          border: 'border-slate-300 dark:border-[#3a3c46]',
          icon: Film,
        };
    }
  };

  const theme = getThemeStyles();
  const Icon = theme.icon;

  return (
    <>
      <div
        style={{ left: `${leftPos}px`, width: `${clipWidth}px` }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        className={`group absolute inset-y-0.5 flex cursor-grab active:cursor-grabbing items-center justify-between rounded-sm border select-none transition-all duration-100 ${
          theme.bg
        } ${theme.border} ${
          isSelected
            ? 'ring-[1.5px] ring-[#009dff] shadow-[0_0_12px_rgba(0,157,255,0.4)] z-20'
            : 'hover:brightness-105 z-10'
        } ${clip.isMuted ? 'opacity-50' : ''}`}
      >
        {/* Left Trim Handle */}
        <div
          onMouseDown={handleTrimLeft}
          title="Drag to trim start"
          className="relative h-full w-2 shrink-0 cursor-col-resize rounded-l-sm hover:bg-neutral-500/20 active:bg-neutral-500/40 dark:hover:bg-white/40 dark:active:bg-white/60 transition flex items-center justify-center z-20"
        >
          <div className="h-3 w-0.5 rounded-full bg-neutral-400 dark:bg-white/40" />
          {trimTooltip && trimTooltip.side === 'left' && (
            <div className="absolute -top-7 left-0 z-30 rounded-md border px-1.5 py-0.5 text-[9px] font-mono shadow-xl pointer-events-none whitespace-nowrap bg-neutral-900 text-white border-neutral-800 dark:bg-white dark:text-neutral-900 dark:border-neutral-200">
              {trimTooltip.text}
            </div>
          )}
        </div>

        {/* Clip Body & Media Visuals */}
        <div className="relative flex flex-1 size-full items-center px-2 overflow-hidden">
          {/* Audio Waveform Canvas/Bars (fills background of audio clips) */}
          {clip.type === 'audio' && (
            <div className="pointer-events-none absolute inset-x-2 inset-y-1 flex items-center justify-between opacity-50 dark:opacity-40">
              {Array.from({ length: Math.min(80, Math.floor(clipWidth / 4)) }).map((_, i) => {
                const h = 25 + Math.sin(i * 0.5) * 45 + Math.cos(i * 1.2) * 25 + (i % 4) * 8;
                return (
                  <div
                    key={i}
                    style={{ height: `${Math.max(20, Math.min(95, h))}%` }}
                    className="w-0.5 rounded-full bg-white"
                  />
                );
              })}
            </div>
          )}

          {/* Clean Single-Line Clip Header: Icon + Name + Duration */}
          <div className="relative z-10 flex w-full items-center gap-1.5 overflow-hidden">
            <Icon className={`h-3 w-3 shrink-0 ${
              clip.type === 'video'
                ? 'text-slate-700 dark:text-white/80'
                : 'text-white/90'
            }`} />
            <span className={`truncate text-xs font-semibold leading-none ${
              clip.type === 'video'
                ? 'text-slate-900 dark:text-white'
                : 'text-white'
            }`}>
              {clip.name}
            </span>
            <span className={`shrink-0 font-mono text-[9px] ml-auto pl-1 ${
              clip.type === 'video'
                ? 'text-slate-600 dark:text-white/60'
                : 'text-white/75'
            }`}>
              {clip.duration.toFixed(1)}s
            </span>
          </div>

          {/* Audio Volume Line Overlay */}
          {clip.type === 'audio' && (
            <div
              style={{ bottom: `${(clip.volume || 1) * 70}%` }}
              className="pointer-events-none absolute inset-x-0 h-px bg-white/40 border-t border-dashed border-white/60"
            />
          )}
        </div>

        {/* Right Trim Handle */}
        <div
          onMouseDown={handleTrimRight}
          title="Drag to trim end"
          className="relative h-full w-2 shrink-0 cursor-col-resize rounded-r-sm hover:bg-neutral-500/20 active:bg-neutral-500/40 dark:hover:bg-white/40 dark:active:bg-white/60 transition flex items-center justify-center z-20"
        >
          <div className="h-3 w-0.5 rounded-full bg-neutral-400 dark:bg-white/40" />
          {trimTooltip && trimTooltip.side === 'right' && (
            <div className="absolute -top-7 right-0 z-30 rounded-md border px-1.5 py-0.5 text-[9px] font-mono shadow-xl pointer-events-none whitespace-nowrap bg-neutral-900 text-white border-neutral-800 dark:bg-white dark:text-neutral-900 dark:border-neutral-200">
              {trimTooltip.text}
            </div>
          )}
        </div>
      </div>

      {/* Right-Click Pro Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 min-w-[190px] rounded-xl border border-neutral-200 bg-white p-1 shadow-2xl backdrop-blur-md text-xs text-neutral-900 select-none animate-in fade-in zoom-in-95 duration-100 dark:border-[#2e2e34] dark:bg-[#18181b] dark:text-[#f4f4f5]"
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-[#2e2e34] mb-1 truncate">
            {clip.name}
          </div>

          <button
            onClick={() => {
              splitClip(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition"
          >
            <div className="flex items-center gap-2">
              <Scissors className="h-3.5 w-3.5" />
              <span>Split at Playhead</span>
            </div>
            <kbd className="text-[10px] text-app-text-muted">S</kbd>
          </button>

          <button
            onClick={() => {
              splitLeft(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition"
          >
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-3.5 w-3.5" />
              <span>Split Left (Trim start)</span>
            </div>
            <kbd className="text-[10px] text-app-text-muted">Q</kbd>
          </button>

          <button
            onClick={() => {
              splitRight(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition"
          >
            <div className="flex items-center gap-2">
              <MoveHorizontal className="h-3.5 w-3.5" />
              <span>Split Right (Trim end)</span>
            </div>
            <kbd className="text-[10px] text-app-text-muted">W</kbd>
          </button>

          <div className="my-1 h-px bg-app-border" />

          {clip.type === 'video' && (
            <button
              onClick={() => {
                extractAudio(clip.id);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition text-emerald-500 font-medium"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Extract / Separate Audio</span>
            </button>
          )}

          <button
            onClick={() => {
              duplicateClip(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition"
          >
            <div className="flex items-center gap-2">
              <Copy className="h-3.5 w-3.5" />
              <span>Duplicate Clip</span>
            </div>
            <kbd className="text-[10px] text-app-text-muted">Ctrl+D</kbd>
          </button>

          <button
            onClick={() => {
              updateClip(clip.id, { isMuted: !clip.isMuted, volume: clip.isMuted ? 1 : 0 });
              setContextMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition"
          >
            {clip.isMuted ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{clip.isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <div className="my-1 h-px bg-app-border" />

          <button
            onClick={() => {
              rippleDelete(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-amber-500/15 text-amber-500 font-medium transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ripple Delete (Close Gap)</span>
            </div>
            <kbd className="text-[10px] opacity-75">Shift+Del</kbd>
          </button>

          <button
            onClick={() => {
              deleteClip(clip.id);
              setContextMenu(null);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-red-500/15 text-red-500 font-medium transition"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Clip</span>
            </div>
            <kbd className="text-[10px] opacity-75">Del</kbd>
          </button>
        </div>
      )}
    </>
  );
};

export default ClipItem;
