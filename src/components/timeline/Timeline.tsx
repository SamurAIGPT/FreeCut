import React, { useRef, useState } from 'react';
import { Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
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
  const duration = useEditorStore((s) => s.duration);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleSplitSelected = () => {
    if (selectedClipId) {
      splitClip(selectedClipId);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedClipId) {
      deleteClip(selectedClipId);
    }
  };

  const timelineHeight = tracks.length * 56 + 28; // 56px per track + 28px ruler

  return (
    <div className="flex h-72 w-full flex-col border-t border-border bg-[#0d0f12]">
      {/* Timeline Toolbar */}
      <div className="flex h-10 w-full items-center justify-between border-b border-border bg-surface px-3">
        {/* Left Editing Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSplitSelected}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-[#0d0f12] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface-elevated hover:text-white disabled:opacity-30"
          >
            <Scissors className="h-3.5 w-3.5 text-blue-400" />
            <span>Split</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-[#0d0f12] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-surface-elevated hover:text-red-400 disabled:opacity-30"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            <span>Delete</span>
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* Snapping Toggle */}
          <button
            onClick={toggleSnapping}
            title="Toggle Magnet Snapping"
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
              isSnapping
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                : 'border-border bg-[#0d0f12] text-slate-500 hover:text-slate-300'
            }`}
          >
            <Magnet className="h-3.5 w-3.5" />
            <span>Snapping</span>
          </button>

          {/* Add Track */}
          <div className="relative flex items-center gap-1 pl-2">
            <button
              onClick={() => addTrack('video')}
              title="Add Video Track"
              className="rounded bg-surface-elevated px-2 py-0.5 text-[11px] text-slate-300 hover:bg-border"
            >
              + Video Track
            </button>
            <button
              onClick={() => addTrack('audio')}
              title="Add Audio Track"
              className="rounded bg-surface-elevated px-2 py-0.5 text-[11px] text-slate-300 hover:bg-border"
            >
              + Audio Track
            </button>
          </div>
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - 15)}
            title="Zoom Out"
            className="text-slate-400 hover:text-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={20}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-primary"
          />
          <button
            onClick={() => setZoom(zoom + 15)}
            title="Zoom In"
            className="text-slate-400 hover:text-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Tracks & Ruler Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Track Headers Column */}
        <div className="flex w-52 shrink-0 flex-col border-r border-border bg-[#0d0f12]">
          {/* Top blank space matching ruler height */}
          <div className="h-7 border-b border-border bg-[#0d0f12]" />
          {/* Track Headers */}
          <div className="flex-1 overflow-hidden">
            {tracks.map((track) => (
              <TrackHeader key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Lanes */}
        <div
          id="timeline-tracks-container"
          ref={containerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-x-auto overflow-y-hidden bg-[#090b0e]"
        >
          {/* Time Ruler */}
          <TimeRuler scrollLeft={scrollLeft} />

          {/* Playhead Needle */}
          <Playhead timelineHeight={timelineHeight} />

          {/* Track Lanes */}
          <div style={{ width: `${(duration + 10) * zoom}px` }} className="relative">
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);
              return (
                <div
                  key={track.id}
                  className="relative h-14 border-b border-border/60 bg-[#0d0f12]/50 hover:bg-[#0d0f12]"
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
