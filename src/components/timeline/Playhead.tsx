import React, { useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';

interface PlayheadProps {
  timelineHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ timelineHeight }) => {
  const playhead = useEditorStore((s) => s.playhead);
  const zoom = useEditorStore((s) => s.zoom);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  const isDraggingRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      // Find timeline offset relative to timeline container
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

  const leftPos = playhead * zoom;

  return (
    <div
      style={{ left: `${leftPos}px` }}
      onMouseDown={handleMouseDown}
      className="absolute top-0 z-30 flex cursor-ew-resize flex-col items-center pointer-events-auto"
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
