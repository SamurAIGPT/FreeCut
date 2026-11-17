import React, { useRef, useState } from 'react';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer, 
  Maximize2, Film, Music, Type 
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
    <div className="flex h-80 w-full flex-col border-t border-[#1f242e] bg-[#090b0e]">
      {/* Timeline Control Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-[#1f242e] bg-[#12141a] px-3">
        {/* Editing Tools (Selection, Razor, Split, Delete, Snapping) */}
        <div className="flex items-center gap-1.5">
          {/* Select Tool */}
          <button
            onClick={() => setActiveTool('select')}
            title="Selection Tool (V)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeTool === 'select'
                ? 'border-blue-500 bg-blue-600/20 text-blue-400'
                : 'border-[#232938] bg-[#0c0e12] text-slate-400 hover:text-white'
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
                ? 'border-red-500 bg-red-600/20 text-red-400'
                : 'border-[#232938] bg-[#0c0e12] text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>Razor</span>
          </button>

          <button
            onClick={() => selectedClipId && splitClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1 rounded-lg border border-[#232938] bg-[#0c0e12] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-[#1a1f2b] hover:text-white disabled:opacity-30 transition"
          >
            <span>Cut at Needle</span>
          </button>

          <button
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1 rounded-lg border border-[#232938] bg-[#0c0e12] px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 transition"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            <span>Delete</span>
          </button>

          <div className="mx-1 h-4 w-px bg-[#232938]" />

          {/* Magnet Snapping */}
          <button
            onClick={toggleSnapping}
            title="Toggle Magnet Snapping"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              isSnapping
                ? 'border-blue-500/50 bg-blue-500/15 text-blue-400'
                : 'border-[#232938] bg-[#0c0e12] text-slate-500 hover:text-slate-300'
            }`}
          >
            <Magnet className="h-3.5 w-3.5" />
            <span>Snapping</span>
          </button>

          {/* Quick Add Track Buttons */}
          <div className="flex items-center gap-1 pl-2">
            <button
              onClick={() => addTrack('video')}
              className="flex items-center gap-1 rounded-md border border-[#232938] bg-[#0c0e12] px-2 py-0.5 text-[11px] text-slate-300 hover:border-blue-500/50 hover:text-white"
            >
              <Plus className="h-3 w-3 text-blue-400" />
              <span>Video</span>
            </button>
            <button
              onClick={() => addTrack('audio')}
              className="flex items-center gap-1 rounded-md border border-[#232938] bg-[#0c0e12] px-2 py-0.5 text-[11px] text-slate-300 hover:border-emerald-500/50 hover:text-white"
            >
              <Plus className="h-3 w-3 text-emerald-400" />
              <span>Audio</span>
            </button>
          </div>
        </div>

        {/* Zoom & Fit Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(zoom - 20)}
            title="Zoom Out"
            className="text-slate-400 hover:text-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={25}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-blue-500"
          />
          <button
            onClick={() => setZoom(zoom + 20)}
            title="Zoom In"
            className="text-slate-400 hover:text-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Track Headers */}
        <div className="flex w-60 shrink-0 flex-col border-r border-[#1f242e] bg-[#0c0e12]">
          <div className="h-7 border-b border-[#1f242e] bg-[#0c0e12] flex items-center px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
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
          className="relative flex-1 overflow-x-auto overflow-y-auto bg-[#07080b]"
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
                  className="relative h-16 border-b border-[#181c24] bg-[#090b0e]/70 hover:bg-[#0c0e14] transition"
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
