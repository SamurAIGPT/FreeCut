import React, { useRef, useState, useEffect } from 'react';
import { Bookmark, X } from 'lucide-react';
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
  const markers = useEditorStore((s) => s.markers);
  const deleteMarker = useEditorStore((s) => s.deleteMarker);
  const addMarker = useEditorStore((s) => s.addMarker);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    if (!rulerRef.current) return;
    setIsScrubbing(true);

    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, clickX / zoom);
    setPlayhead(clickedTime);
  };

  useEffect(() => {
    if (!isScrubbing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickedTime = Math.max(0, Math.min(clickX / zoom, duration + 10));
      setPlayhead(clickedTime);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, zoom, duration, setPlayhead]);

  const totalSeconds = Math.ceil(duration) + 15;
  const ticks = [];
  const step = zoom < 40 ? 5 : zoom < 75 ? 2 : 1;

  for (let s = 0; s <= totalSeconds; s += step) {
    ticks.push(
      <div
        key={`tick-${s}`}
        className="absolute bottom-0 flex flex-col items-center pointer-events-none"
        style={{ left: s * zoom }}
      >
        <span className="font-mono text-[9px] text-app-text-muted mb-0.5">{formatShortTime(s)}</span>
        <div className="h-2 w-px bg-app-border" />
      </div>
    );

    // Minor sub-second tick marks if zoomed in
    if (zoom >= 80) {
      for (let sub = 1; sub < 4; sub++) {
        const subTime = s + sub * 0.25;
        if (subTime <= totalSeconds) {
          ticks.push(
            <div
              key={`sub-${subTime}`}
              className="absolute bottom-0 pointer-events-none"
              style={{ left: subTime * zoom }}
            >
              <div className="h-1 w-px bg-app-border/60" />
            </div>
          );
        }
      }
    }
  }

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        if (!rulerRef.current) return;
        const rect = rulerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        addMarker(clickX / zoom);
      }}
      style={{ width: `${(duration + 15) * zoom}px` }}
      className="relative h-8 cursor-pointer border-b border-app-border bg-app-surface select-none transition-colors duration-200"
      title="Click or drag to scrub time. Double-click to add marker."
    >
      {/* Markers / Bookmarks Row */}
      {markers.map((marker) => {
        const markerLeft = marker.time * zoom;
        const isHovered = hoveredMarker === marker.id;

        return (
          <div
            key={marker.id}
            style={{ left: `${markerLeft}px` }}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
            onClick={(e) => {
              e.stopPropagation();
              setPlayhead(marker.time);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteMarker(marker.id);
            }}
            className="group absolute top-0 z-20 flex flex-col items-center -translate-x-1/2 cursor-pointer"
            title={`${marker.label} (${formatShortTime(marker.time)}) — Right-click to delete`}
          >
            {/* Diamond marker pin */}
            <div
              style={{ backgroundColor: marker.color }}
              className="h-3 w-3 rotate-45 rounded-[2px] shadow-sm ring-1 ring-white/40 transition-transform group-hover:scale-125"
            />
            {/* Hanging thread */}
            <div
              style={{ backgroundColor: marker.color }}
              className="h-2 w-0.5 opacity-80"
            />

            {/* Hover Tooltip */}
            {isHovered && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-sm border border-neutral-300 bg-white px-2 py-0.5 text-[9px] font-semibold text-neutral-900 shadow-md pointer-events-none whitespace-nowrap dark:border-[#2e2e34] dark:bg-[#18181b] dark:text-[#f4f4f5]">
                <span>{marker.label}</span>
                <span className="opacity-70 font-mono">({formatShortTime(marker.time)})</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Timecode Ticks */}
      {ticks}
    </div>
  );
};

export default TimeRuler;
