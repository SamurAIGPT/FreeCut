import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, X, Check, Trash2, Edit2, Clock } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatShortTime } from '@/utils/time';
import { TimelineMarker } from '@/types/editor';

const MARKER_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#ef4444' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
];

interface TimeRulerProps {
  scrollLeft: number;
  timelineHeight?: number;
}

export const TimeRuler: React.FC<TimeRulerProps> = ({ scrollLeft, timelineHeight = 400 }) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const zoom = useEditorStore((s) => s.zoom);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const playhead = useEditorStore((s) => s.playhead);
  const markers = useEditorStore((s) => s.markers);
  const deleteMarker = useEditorStore((s) => s.deleteMarker);
  const addMarker = useEditorStore((s) => s.addMarker);
  const moveMarker = useEditorStore((s) => s.moveMarker);
  const updateMarker = useEditorStore((s) => s.updateMarker);
  const clips = useEditorStore((s) => s.clips);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const setSnapGuideX = useEditorStore((s) => s.setSnapGuideX);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [editingMarker, setEditingMarker] = useState<TimelineMarker | null>(null);
  const [markerContextMenu, setMarkerContextMenu] = useState<{ marker: TimelineMarker; x: number; y: number } | null>(null);

  const dragRef = useRef<{
    id: string;
    startClientX: number;
    startTime: number;
    hasMoved: boolean;
  } | null>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    const handleGlobalClick = () => {
      setMarkerContextMenu(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMarkerContextMenu(null);
        setEditingMarker(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('contextmenu', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('contextmenu', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 1. Ruler Scrubbing
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    if (draggingMarkerId) return;
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

  // 2. Interactive Marker Dragging along Ruler & across Tracks
  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, marker: TimelineMarker) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    e.preventDefault();

    dragRef.current = {
      id: marker.id,
      startClientX: e.clientX,
      startTime: marker.time,
      hasMoved: false,
    };
    setDraggingMarkerId(marker.id);
  }, []);

  useEffect(() => {
    if (!draggingMarkerId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !rulerRef.current) return;
      const deltaX = Math.abs(e.clientX - dragRef.current.startClientX);
      if (deltaX > 3) {
        dragRef.current.hasMoved = true;
      }

      if (!dragRef.current.hasMoved) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const rawTime = Math.max(0, (e.clientX - rect.left) / zoom);
      let targetTime = rawTime;

      // Snapping (Shift key temporarily disables snap)
      const shouldSnap = isSnapping && !e.shiftKey;
      if (shouldSnap) {
        const snapPoints: number[] = [playhead];
        // Clip start and end points
        clips.forEach((c) => {
          snapPoints.push(c.start);
          snapPoints.push(c.start + c.duration);
        });
        // Other markers
        markers.forEach((m) => {
          if (m.id !== dragRef.current?.id) {
            snapPoints.push(m.time);
          }
        });

        const thresholdTime = 8 / zoom; // 8 screen pixels threshold
        let closestSnap: number | null = null;
        let minDistance = Infinity;

        for (const sp of snapPoints) {
          const dist = Math.abs(sp - rawTime);
          if (dist < thresholdTime && dist < minDistance) {
            minDistance = dist;
            closestSnap = sp;
          }
        }

        if (closestSnap !== null) {
          targetTime = closestSnap;
          setSnapGuideX(targetTime);
        } else {
          setSnapGuideX(null);
        }
      } else {
        setSnapGuideX(null);
      }

      moveMarker(dragRef.current.id, targetTime);
    };

    const handleMouseUp = () => {
      setSnapGuideX(null);
      if (dragRef.current && !dragRef.current.hasMoved) {
        // Just clicked without drag -> seek playhead to marker time
        const currentMarker = markers.find((m) => m.id === dragRef.current?.id);
        if (currentMarker) {
          setPlayhead(currentMarker.time);
        }
      }
      dragRef.current = null;
      setDraggingMarkerId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMarkerId, zoom, isSnapping, playhead, clips, markers, moveMarker, setPlayhead, setSnapGuideX]);

  // 3. Ruler Ticks Generation
  const totalSeconds = Math.ceil(duration) + 15;
  const ticks = [];
  const step = zoom < 40 ? 5 : zoom < 75 ? 2 : 1;

  for (let s = 0; s <= totalSeconds; s += step) {
    ticks.push(
      <div
        key={`tick-${s}`}
        className="absolute bottom-0 flex flex-col items-center pointer-events-none select-none"
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
              className="absolute bottom-0 pointer-events-none select-none"
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
      onMouseDown={handleRulerMouseDown}
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
      {/* Markers / Bookmarks Pins and Vertical Track Lines */}
      {markers.map((marker) => {
        const markerLeft = marker.time * zoom;
        const isHovered = hoveredMarkerId === marker.id;
        const isDragging = draggingMarkerId === marker.id;

        return (
          <React.Fragment key={marker.id}>
            {/* Interactive Vertical Line across Tracks Area */}
            <div
              style={{
                left: `${markerLeft}px`,
                height: `${timelineHeight}px`,
                top: 0,
              }}
              onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
              onMouseEnter={() => setHoveredMarkerId(marker.id)}
              onMouseLeave={() => setHoveredMarkerId((cur) => (cur === marker.id ? null : cur))}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMarkerContextMenu({ marker, x: e.clientX, y: e.clientY });
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingMarker(marker);
              }}
              className="group/line absolute w-4 -translate-x-1/2 z-30 cursor-ew-resize select-none"
              title={`${marker.label} (${formatShortTime(marker.time)}) — Drag to move across tracks, double-click to edit`}
            >
              {/* Subtle translucent or glowing vertical track line */}
              <div
                style={{
                  backgroundColor: marker.color,
                }}
                className={`mx-auto h-full transition-all duration-150 ${
                  isDragging
                    ? 'w-1 opacity-100 shadow-[0_0_12px_rgba(255,255,255,0.9)]'
                    : isHovered
                    ? 'w-0.5 opacity-85 shadow-[0_0_6px_rgba(0,0,0,0.5)]'
                    : 'w-px opacity-35 group-hover/line:opacity-75 group-hover/line:w-0.5'
                }`}
              />
            </div>

            {/* Diamond Pin Marker on the Ruler */}
            <div
              style={{ left: `${markerLeft}px` }}
              onMouseDown={(e) => handleMarkerMouseDown(e, marker)}
              onMouseEnter={() => setHoveredMarkerId(marker.id)}
              onMouseLeave={() => setHoveredMarkerId((cur) => (cur === marker.id ? null : cur))}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditingMarker(marker);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMarkerContextMenu({ marker, x: e.clientX, y: e.clientY });
              }}
              className={`group absolute top-0 z-40 flex flex-col items-center -translate-x-1/2 select-none ${
                isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-110'
              } transition-transform`}
              title={`${marker.label} (${formatShortTime(marker.time)}) — Drag to move, double-click to edit, right-click to delete`}
            >
              {/* Diamond Pin Head */}
              <div
                style={{ backgroundColor: marker.color }}
                className="h-3.5 w-3.5 rotate-45 rounded-[2.5px] shadow-md ring-1 ring-white/60 transition-transform group-hover:scale-125"
              />

              {/* Hanging pin stem */}
              <div
                style={{ backgroundColor: marker.color }}
                className="h-2 w-0.5 opacity-90"
              />

              {/* Tooltip on Hover or Drag */}
              {(isHovered || isDragging) && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold shadow-2xl pointer-events-none whitespace-nowrap bg-neutral-900 text-white border-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-300">
                  <Bookmark className="h-3 w-3 fill-current opacity-80" />
                  <span>{marker.label}</span>
                  <span className="font-mono opacity-75">({formatShortTime(marker.time)})</span>
                  {isDragging && <span className="rounded bg-blue-500/30 px-1 py-0.2 text-[9px] text-blue-300 dark:text-blue-700">Moving</span>}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

      {/* Timecode Ticks */}
      {ticks}

      {/* Right-Click Context Menu for Markers */}
      {markerContextMenu &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${markerContextMenu.x}px`,
              top: `${markerContextMenu.y}px`,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-48 overflow-hidden rounded-xl border border-app-border bg-app-surface/98 backdrop-blur-md p-1 shadow-2xl text-xs text-app-text select-none animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold text-app-text-muted border-b border-app-border/60 uppercase tracking-wider flex items-center justify-between">
              <span className="truncate max-w-[100px]">{markerContextMenu.marker.label}</span>
              <span className="font-mono text-[9px]">{formatShortTime(markerContextMenu.marker.time)}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setPlayhead(markerContextMenu.marker.time);
                setMarkerContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition text-left cursor-pointer mt-0.5"
            >
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>Seek Playhead Here</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingMarker(markerContextMenu.marker);
                setMarkerContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-app-elevated transition text-left cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5 text-app-text-muted" />
              <span>Edit Marker...</span>
            </button>

            <button
              type="button"
              onClick={() => {
                deleteMarker(markerContextMenu.marker.id);
                setMarkerContextMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-red-500/15 text-red-500 hover:text-red-400 transition text-left cursor-pointer mt-0.5 border-t border-app-border/40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Marker</span>
            </button>
          </div>,
          document.body
        )}

      {/* Edit Marker Modal Dialog */}
      {editingMarker &&
        createPortal(
          <div
            onClick={() => setEditingMarker(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl text-xs text-app-text space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-app-border pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-blue-500 fill-current" />
                  <span className="font-bold text-sm text-app-text">Edit Timeline Marker</span>
                </div>
                <button
                  onClick={() => setEditingMarker(null)}
                  className="rounded-lg p-1 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Marker Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-app-text-muted">Marker Label</label>
                <input
                  type="text"
                  value={editingMarker.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setEditingMarker({ ...editingMarker, label });
                    updateMarker(editingMarker.id, { label });
                  }}
                  className="w-full rounded-xl border border-app-border bg-app-elevated px-3 py-2 text-xs text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Intro Cut, B-Roll In"
                  autoFocus
                />
              </div>

              {/* Marker Color Swatches */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-app-text-muted">Marker Color</label>
                <div className="flex items-center gap-2">
                  {MARKER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setEditingMarker({ ...editingMarker, color: c.value });
                        updateMarker(editingMarker.id, { color: c.value });
                      }}
                      style={{ backgroundColor: c.value }}
                      className={`h-6 w-6 rounded-full transition cursor-pointer flex items-center justify-center shadow-sm ${
                        editingMarker.color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={c.name}
                    >
                      {editingMarker.color === c.value && <Check className="h-3 w-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Time Position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-app-text-muted">Time Position (seconds)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingMarker.time}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value);
                      if (!isNaN(t)) {
                        setEditingMarker({ ...editingMarker, time: t });
                        moveMarker(editingMarker.id, t);
                      }
                    }}
                    className="flex-1 rounded-xl border border-app-border bg-app-elevated px-3 py-2 text-xs font-mono text-app-text focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="font-mono text-xs text-app-text-muted">
                    {formatShortTime(editingMarker.time)}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-app-border">
                <button
                  type="button"
                  onClick={() => {
                    deleteMarker(editingMarker.id);
                    setEditingMarker(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingMarker(null)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TimeRuler;
