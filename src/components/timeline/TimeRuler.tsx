import React, { useRef } from 'react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatShortTime } from '@/utils/time';

interface TimeRulerProps {
  scrollLeft: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ scrollLeft }) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const zoom = useEditorStore((s) => s.zoom);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, clickX / zoom);
    setPlayhead(clickedTime);
  };

  // Generate tick marks
  const totalSeconds = Math.ceil(duration) + 10;
  const ticks = [];
  const step = zoom < 40 ? 5 : zoom < 80 ? 2 : 1; // Major mark step

  for (let s = 0; s <= totalSeconds; s += step) {
    ticks.push(
      <div
        key={`tick-${s}`}
        className="absolute top-0 flex flex-col items-center"
        style={{ left: s * zoom }}
      >
        <span className="font-mono text-[9px] text-slate-500">{formatShortTime(s)}</span>
        <div className="h-2 w-px bg-slate-700" />
      </div>
    );
  }

  return (
    <div
      ref={rulerRef}
      onClick={handleClick}
      style={{ width: `${(duration + 10) * zoom}px` }}
      className="relative h-7 cursor-pointer border-b border-border bg-[#0d0f12] select-none"
    >
      {ticks}
    </div>
  );
};
