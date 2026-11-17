import React, { useRef, useState } from 'react';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackHeader } from './TrackHeader';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { ClipItem } from './ClipItem';

export const Timeline: React.FC = () => {
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const splitClip = useEditorStore((s) => s.splitClip);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const toggleSnapping = useEditorStore((s) => s.toggleSnapping);
  const addTrack = useEditorStore((s) => s.addTrack);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const duration = useEditorStore((s) => s.duration);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const timelineHeight = tracks.length * 64 + 28;

  return (
    <div className="flex h-80 w-full flex-col border-t border-app-border bg-app-bg select-none transition-colors duration-200">
      {/* Timeline Control Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-app-border bg-app-surface px-3">
        {/* Editing Tools (Selection, Razor, Split, Delete, Snapping) */}
        <div className="flex items-center gap-1.5">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool('select')}
            title="Selection Tool (V)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeTool === 'select'
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select</span>
          </button>

          {/* Razor Tool */}
          <button
            onClick={() => setActiveTool('razor')}
            title="Razor Tool (Click clip to cut)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeTool === 'razor'
                ? 'border-red-500 bg-red-500/15 text-red-500 font-semibold'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>Razor</span>
          </button>

          <button
            onClick={() => selectedClipId && splitClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1 text-xs font-medium text-app-text hover:bg-app-surface disabled:opacity-30 transition"
          >
            <span>Cut at Needle</span>
          </button>

          <button
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1 text-xs font-medium text-app-text hover:bg-red-500/15 hover:text-red-500 disabled:opacity-30 transition"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span>Delete</span>
          </button>

          <div className="mx-1 h-4 w-px bg-app-border" />

          {/* Magnet Snapping */}
          <button
            onClick={toggleSnapping}
            title="Toggle Magnet Snapping"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              isSnapping
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text'
            }`}
          >
            <Magnet className="h-3.5 w-3.5" />
            <span>Snapping</span>
          </button>

          {/* Quick Add Track Buttons */}
          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={() => addTrack('video')}
              className="flex items-center gap-1 rounded-md border border-app-border bg-app-elevated px-2 py-0.5 text-[11px] text-app-text hover:bg-app-surface"
            >
              <Plus className="h-3 w-3" />
              <span>Video</span>
            </button>
            <button
              onClick={() => addTrack('audio')}
              className="flex items-center gap-1 rounded-md border border-app-border bg-app-elevated px-2 py-0.5 text-[11px] text-app-text hover:bg-app-surface"
            >
              <Plus className="h-3 w-3" />
              <span>Audio</span>
            </button>
          </div>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - 20)}
            title="Zoom Out"
            className="text-app-text-muted hover:text-app-text"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={25}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-neutral-800 dark:accent-neutral-200"
          />
          <button
            onClick={() => setZoom(zoom + 20)}
            title="Zoom In"
            className="text-app-text-muted hover:text-app-text"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Track Headers */}
        <div className="flex w-60 shrink-0 flex-col border-r border-app-border bg-app-surface">
          <div className="h-7 border-b border-app-border bg-app-surface flex items-center px-3 text-[10px] font-semibold tracking-wider text-app-text-muted uppercase">
            Tracks
          </div>
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track) => (
              <TrackHeader key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Area */}
        <div
          id="timeline-tracks-container"
          ref={containerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-x-auto overflow-y-auto bg-app-bg"
        >
          {/* Time Ruler */}
          <TimeRuler scrollLeft={scrollLeft} />

          {/* Scrubbing Needle */}
          <Playhead timelineHeight={timelineHeight} />

          {/* Tracks and Clips */}
          <div style={{ width: `${(duration + 15) * zoom}px` }} className="relative">
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);
              return (
                <div
                  key={track.id}
                  className="relative h-16 border-b border-app-border/60 bg-app-surface/40 hover:bg-app-surface/70 transition"
                >
                  {trackClips.map((clip) => (
                    <ClipItem key={clip.id} clip={clip} isLocked={track.isLocked} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
