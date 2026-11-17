import React, { useRef } from 'react';
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

  const isSelected = selectedClipId === clip.id;

  // Handle Dragging Clip Position
  const handleDragStart = (e: React.MouseEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    setSelectedClipId(clip.id);

    const startX = e.clientX;
    const initialStart = clip.start;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newStart = Math.max(0, initialStart + deltaX / zoom);

      // Snap to playhead if close (within 8px)
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

  // Handle Trimming Right Handle (Out-Point)
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

  // Handle Trimming Left Handle (In-Point)
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

  // Dynamic Theme Colors
  const getBadgeStyle = () => {
    switch (clip.type) {
      case 'audio':
        return 'bg-emerald-600/80 border-emerald-500 text-emerald-100';
      case 'text':
        return 'bg-amber-600/80 border-amber-500 text-amber-100';
      case 'video':
      default:
        return 'bg-blue-600/80 border-blue-500 text-blue-100';
    }
  };

  const leftPos = clip.start * zoom;
  const clipWidth = Math.max(12, clip.duration * zoom);

  return (
    <div
      style={{ left: `${leftPos}px`, width: `${clipWidth}px` }}
      onMouseDown={handleDragStart}
      className={`group absolute top-1.5 bottom-1.5 flex cursor-grab active:cursor-grabbing items-center justify-between rounded-md border text-xs shadow-md select-none ${getBadgeStyle()} ${
        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0d0f12]' : ''
      }`}
    >
      {/* Left Trim Handle */}
      <div
        onMouseDown={handleTrimLeft}
        title="Trim Start"
        className="h-full w-2 shrink-0 cursor-w-resize rounded-l-md hover:bg-white/40 active:bg-white/60"
      />

      {/* Clip Content Label */}
      <div className="flex flex-1 items-center gap-1.5 overflow-hidden px-1.5">
        <span className="truncate font-medium">{clip.name}</span>
        <span className="shrink-0 text-[10px] opacity-75">{clip.duration.toFixed(1)}s</span>
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRight}
        title="Trim End"
        className="h-full w-2 shrink-0 cursor-e-resize rounded-r-md hover:bg-white/40 active:bg-white/60"
      />
    </div>
  );
};
