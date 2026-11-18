import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

interface PlayheadProps {
  timelineHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ timelineHeight }) => {
  const playhead = useEditorStore((s) => s.playhead);
  const zoom = useEditorStore((s) => s.zoom);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const container = document.getElementById('timeline-tracks-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clientX = moveEvent.clientX - rect.left + container.scrollLeft;
      const newTime = Math.max(0, clientX / zoom);
      setPlayhead(newTime);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Auto-scroll timeline to follow playhead when playing
  useEffect(() => {
    if (!isPlaying) return;
    const container = document.getElementById('timeline-tracks-container');
    if (!container) return;

    const playheadPx = playhead * zoom;
    const viewportLeft = container.scrollLeft;
    const viewportRight = viewportLeft + container.clientWidth;

    // If playhead moves past 85% of visible viewport or falls behind
    if (playheadPx > viewportRight - 40 || playheadPx < viewportLeft) {
      container.scrollLeft = Math.max(0, playheadPx - container.clientWidth * 0.2);
    }
  }, [playhead, zoom, isPlaying]);

  const leftPos = Math.round(playhead * zoom);

  return (
    <div
      style={{
        transform: `translate3d(${leftPos}px, 0, 0)`,
        willChange: 'transform',
      }}
      onMouseDown={handleMouseDown}
      className="absolute top-0 left-0 z-30 flex cursor-ew-resize flex-col items-center pointer-events-auto"
    >
      {/* Triangular Playhead Needle Head */}
      <div className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-red-500 shadow-sm" />
      {/* Thin Line traversing all tracks */}
      <div
        style={{ height: `${timelineHeight}px` }}
        className="w-[1.5px] bg-red-500 shadow-sm shadow-red-500/50"
      />
    </div>
  );
};
