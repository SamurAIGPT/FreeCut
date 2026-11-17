import React from 'react';
import { Film, Music, Type, Sparkles } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { Clip } from '@/types/editor';

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

  const isSelected = selectedClipId === clip.id;

  // Handle Dragging Clip Position or Razor Click
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();

    if (activeTool === 'razor') {
      splitClip(clip.id);
      return;
    }

    setSelectedClipId(clip.id);

    const startX = e.clientX;
    const initialStart = clip.start;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newStart = Math.max(0, initialStart + deltaX / zoom);

      if (isSnapping && Math.abs(newStart - playhead) < 8 / zoom) {
        newStart = playhead;
      }

      updateClip(clip.id, { start: newStart });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Trimming Handles
  const handleTrimRight = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = clip.duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newDuration = Math.max(0.2, initialDuration + deltaX / zoom);
      updateClip(clip.id, {
        duration: newDuration,
        trimEnd: clip.trimStart + newDuration,
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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
      const newStart = Math.max(0, initialStart + timeDelta);
      const newDuration = Math.max(0.2, initialDuration - timeDelta);

      if (newDuration > 0.2) {
        updateClip(clip.id, {
          start: newStart,
          duration: newDuration,
          trimStart: initialTrimStart + timeDelta,
        });
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const leftPos = clip.start * zoom;
  const clipWidth = Math.max(16, clip.duration * zoom);

  // Styling based on clip type
  const getThemeStyles = () => {
    switch (clip.type) {
      case 'audio':
        return {
          bg: 'bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80',
          border: 'border-emerald-600/70',
          glow: 'shadow-emerald-500/20',
          badge: 'bg-emerald-600 text-white',
          icon: Music,
        };
      case 'text':
        return {
          bg: 'bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80',
          border: 'border-amber-600/70',
          glow: 'shadow-amber-500/20',
          badge: 'bg-amber-600 text-white',
          icon: Type,
        };
      case 'video':
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-950/80 via-blue-900/60 to-blue-950/80',
          border: 'border-blue-600/70',
          glow: 'shadow-blue-500/20',
          badge: 'bg-blue-600 text-white',
          icon: Film,
        };
    }
  };

  const theme = getThemeStyles();
  const Icon = theme.icon;

  return (
    <div
      style={{ left: `${leftPos}px`, width: `${clipWidth}px` }}
      onMouseDown={handleMouseDown}
      className={`group absolute top-1.5 bottom-1.5 flex cursor-grab active:cursor-grabbing items-center justify-between rounded-lg border backdrop-blur-md select-none transition-shadow ${
        theme.bg
      } ${theme.border} ${
        isSelected
          ? 'ring-2 ring-white ring-offset-2 ring-offset-[#090b0e] shadow-xl ' + theme.glow
          : 'hover:border-white/60'
      }`}
    >
      {/* Left Trim Handle */}
      <div
        onMouseDown={handleTrimLeft}
        title="Trim Start"
        className="h-full w-2 shrink-0 cursor-w-resize rounded-l-md hover:bg-white/40 active:bg-white/70 transition"
      />

      {/* Internal Visual Details: Filmstrip / Waveforms */}
      <div className="relative flex flex-1 items-center overflow-hidden px-2 h-full">
        {/* Audio Waveform visualization */}
        {clip.type === 'audio' && (
          <div className="pointer-events-none absolute inset-x-2 inset-y-1 flex items-center justify-between opacity-35">
            {Array.from({ length: Math.min(60, Math.floor(clipWidth / 5)) }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.8) * 40 + (i % 3) * 15;
              return (
                <div
                  key={i}
                  style={{ height: `${Math.max(15, Math.min(85, h))}%` }}
                  className="w-0.5 rounded-full bg-emerald-400"
                />
              );
            })}
          </div>
        )}

        {/* Video Filmstrip frame indicators */}
        {clip.type === 'video' && (
          <div className="pointer-events-none absolute inset-x-1 inset-y-1 flex items-center gap-6 opacity-20 overflow-hidden">
            {Array.from({ length: Math.min(15, Math.floor(clipWidth / 48)) }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <div className="h-2 w-2 rounded-sm border border-slate-300" />
                <div className="h-5 w-7 rounded border border-dashed border-slate-400" />
                <div className="h-2 w-2 rounded-sm border border-slate-300" />
              </div>
            ))}
          </div>
        )}

        {/* Clip Title & Type Badge */}
        <div className="z-10 flex items-center gap-1.5 overflow-hidden">
          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${theme.badge}`}>
            <Icon className="h-2.5 w-2.5" />
          </div>
          <span className="truncate text-[11px] font-semibold text-slate-100 drop-shadow-sm">
            {clip.name}
          </span>
          <span className="shrink-0 font-mono text-[9px] text-slate-400 ml-1">
            {clip.duration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRight}
        title="Trim End"
        className="h-full w-2 shrink-0 cursor-e-resize rounded-r-md hover:bg-white/40 active:bg-white/70 transition"
      />
    </div>
  );
};
