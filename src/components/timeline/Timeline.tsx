import React, { useRef, useState } from 'react';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer, 
  Copy, Link2, Bookmark, Sparkles, AlignLeft, AlignRight, Maximize2 
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { TrackHeader } from './TrackHeader';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { ClipItem } from './ClipItem';
import { Tooltip } from '@/components/ui/Tooltip';

export const Timeline: React.FC = () => {
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const tracks = useEditorStore((s) => s.tracks);
  const clips = useEditorStore((s) => s.clips);
  const zoom = useEditorStore((s) => s.zoom);
  const duration = useEditorStore((s) => s.duration);
  const playhead = useEditorStore((s) => s.playhead);
  const selectedClipId = useEditorStore((s) => s.selectedClipId);
  const splitClip = useEditorStore((s) => s.splitClip);
  const splitLeft = useEditorStore((s) => s.splitLeft);
  const splitRight = useEditorStore((s) => s.splitRight);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const extractAudio = useEditorStore((s) => s.extractAudio);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const addMarker = useEditorStore((s) => s.addMarker);
  const setZoom = useEditorStore((s) => s.setZoom);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const toggleSnapping = useEditorStore((s) => s.toggleSnapping);
  const addTrack = useEditorStore((s) => s.addTrack);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const snapGuideX = useEditorStore((s) => s.snapGuideX);

  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const isVideoSelected = selectedClip?.type === 'video';

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleFitToZoom = () => {
    if (!containerRef.current) return;
    const viewportWidth = containerRef.current.clientWidth - 40;
    const effectiveDuration = Math.max(duration, 5);
    const newZoom = Math.min(250, Math.max(25, viewportWidth / effectiveDuration));
    setZoom(Math.round(newZoom));
  };

  const timelineHeight = tracks.length * 64 + 32;

  return (
    <div className="flex h-64 sm:h-72 lg:h-80 w-full shrink-0 flex-col border-t border-app-border bg-app-bg select-none transition-colors duration-200">
      {/* Timeline Pro Control Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-app-border bg-app-surface px-3 gap-2 overflow-x-auto scrollbar-hidden">
        {/* Left Section: Labeled & Icon Editing Tools with Hover Tooltips */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Select Tool (V) */}
          <Tooltip content="Selection Tool" shortcut="V" side="top">
            <button
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-1.5 h-7.5 rounded-md px-2.5 text-xs font-semibold border transition cursor-pointer ${
                activeTool === 'select'
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-neutral-950'
                  : 'border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950 dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-300 dark:hover:bg-[#27272a] dark:hover:text-white'
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
              <span>Select</span>
            </button>
          </Tooltip>

          {/* Razor Tool (C) */}
          <Tooltip content="Razor Tool (Click clip to cut)" shortcut="C" side="top">
            <button
              onClick={() => setActiveTool('razor')}
              className={`flex items-center gap-1.5 h-7.5 rounded-md px-2.5 text-xs font-semibold border transition cursor-pointer ${
                activeTool === 'razor'
                  ? 'border-red-500 bg-red-500/15 text-red-600 dark:border-red-500 dark:bg-red-500/20 dark:text-red-400 shadow-xs'
                  : 'border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950 dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-300 dark:hover:bg-[#27272a] dark:hover:text-white'
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>Razor</span>
            </button>
          </Tooltip>

          <div className="mx-0.5 h-4 w-px bg-neutral-300 dark:bg-neutral-700" />

          {/* Split at Playhead (S) */}
          <Tooltip content="Split element at playhead" shortcut="S" side="top">
            <button
              onClick={() => selectedClipId && splitClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-200 dark:hover:bg-[#27272a]"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split</span>
            </button>
          </Tooltip>

          {/* Split Left (Q) */}
          <Tooltip content="Split left (Trim start to playhead)" shortcut="Q" side="top">
            <button
              onClick={() => selectedClipId && splitLeft(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-200 dark:hover:bg-[#27272a]"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Left (Q)</span>
            </button>
          </Tooltip>

          {/* Split Right (W) */}
          <Tooltip content="Split right (Trim end to playhead)" shortcut="W" side="top">
            <button
              onClick={() => selectedClipId && splitRight(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-200 dark:hover:bg-[#27272a]"
            >
              <AlignRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Right (W)</span>
            </button>
          </Tooltip>

          {/* Separate / Extract Audio from Video */}
          <Tooltip content={isVideoSelected ? "Extract / Separate audio" : "Select video to extract audio"} side="top">
            <button
              onClick={() => selectedClipId && isVideoSelected && extractAudio(selectedClipId)}
              disabled={!selectedClipId || !isVideoSelected}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-emerald-600 hover:bg-emerald-500/10 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-emerald-400 dark:hover:bg-emerald-500/15"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Extract Audio</span>
            </button>
          </Tooltip>

          {/* Duplicate Clip (Ctrl+D) */}
          <Tooltip content="Duplicate element" shortcut="Ctrl+D" side="top">
            <button
              onClick={() => selectedClipId && duplicateClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-200 dark:hover:bg-[#27272a]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Duplicate</span>
            </button>
          </Tooltip>

          {/* Ripple Delete (Shift+Del) */}
          <Tooltip content="Ripple delete (Close gap)" shortcut="Shift+Del" side="top">
            <button
              onClick={() => selectedClipId && rippleDelete(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-amber-600 hover:bg-amber-500/10 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-amber-400 dark:hover:bg-amber-500/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Ripple Del</span>
            </button>
          </Tooltip>

          {/* Delete (Del) */}
          <Tooltip content="Delete element" shortcut="Del" side="top">
            <button
              onClick={() => selectedClipId && deleteClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex items-center justify-center h-7.5 w-7.5 rounded-md border border-neutral-300 bg-neutral-100 text-red-500 hover:bg-red-500/10 disabled:opacity-40 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:hover:bg-red-500/15"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div className="mx-0.5 h-4 w-px bg-neutral-300 dark:bg-neutral-700" />

          {/* Add Bookmark / Marker (M) */}
          <Tooltip content="Add bookmark" shortcut="M" side="top">
            <button
              onClick={() => addMarker(playhead)}
              className="flex items-center gap-1 h-7.5 rounded-md px-2 text-xs font-medium border border-neutral-300 bg-neutral-100 text-blue-600 hover:bg-blue-500/10 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-blue-400 dark:hover:bg-blue-500/15"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Marker</span>
            </button>
          </Tooltip>

          {/* Magnet Snapping Toggle */}
          <Tooltip content={isSnapping ? "Auto snapping ON" : "Auto snapping OFF"} side="top">
            <button
              onClick={toggleSnapping}
              className={`flex items-center gap-1.5 h-7.5 rounded-md px-2 text-xs font-semibold border transition cursor-pointer ${
                isSnapping
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-neutral-950'
                  : 'border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950 dark:border-[#27272a] dark:bg-[#18181b] dark:text-neutral-300 dark:hover:bg-[#27272a] dark:hover:text-white'
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
              <span>Snap</span>
            </button>
          </Tooltip>

          {/* Quick Add Track Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <Tooltip content="Add Video Track" side="top">
              <button
                onClick={() => addTrack('video')}
                className="flex items-center gap-1 rounded-md border border-neutral-300 bg-neutral-100 px-2 h-7.5 text-[11px] font-semibold text-blue-600 hover:bg-blue-500/10 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-blue-400 dark:hover:bg-blue-500/15"
              >
                <Plus className="h-3 w-3" />
                <span>Video</span>
              </button>
            </Tooltip>

            <Tooltip content="Add Audio Track" side="top">
              <button
                onClick={() => addTrack('audio')}
                className="flex items-center gap-1 rounded-md border border-neutral-300 bg-neutral-100 px-2 h-7.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-emerald-400 dark:hover:bg-emerald-500/15"
              >
                <Plus className="h-3 w-3" />
                <span>Audio</span>
              </button>
            </Tooltip>

            <Tooltip content="Add Text Track" side="top">
              <button
                onClick={() => addTrack('text')}
                className="flex items-center gap-1 rounded-md border border-neutral-300 bg-neutral-100 px-2 h-7.5 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/10 transition cursor-pointer dark:border-[#27272a] dark:bg-[#18181b] dark:text-amber-400 dark:hover:bg-amber-500/15"
              >
                <Plus className="h-3 w-3" />
                <span>Text</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Zoom & Scale Controls with Tooltips */}
        <div className="flex items-center gap-1 shrink-0 ml-auto pl-2">
          <Tooltip content="Fit timeline to screen" side="top">
            <button
              onClick={handleFitToZoom}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Zoom Out" side="top">
            <button
              onClick={() => setZoom(zoom - 20)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <input
            type="range"
            min={25}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-20 accent-neutral-900 dark:accent-neutral-100"
          />

          <Tooltip content="Zoom In" side="top">
            <button
              onClick={() => setZoom(zoom + 20)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition cursor-pointer dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main Timeline Workspace (Fixed Left Headers + Horizontally Scrollable Lanes) */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Track Control Headers */}
        <div className="flex w-80 shrink-0 flex-col border-r border-app-border bg-app-surface select-none z-30 transition-colors duration-200">
          <div className="flex h-8 items-center justify-between border-b border-app-border px-3 text-[11px] font-bold tracking-wider text-app-text-muted uppercase">
            <span>Tracks ({tracks.length})</span>
            <span className="font-mono text-[9px] opacity-60 lowercase">scroll ↕</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, idx) => (
              <TrackHeader 
                key={track.id} 
                track={track} 
                index={idx} 
                totalTracks={tracks.length} 
              />
            ))}
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas Area */}
        <div
          id="timeline-tracks-container"
          ref={containerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-x-auto overflow-y-auto bg-app-bg"
        >
          {/* Time Ruler with Markers */}
          <TimeRuler scrollLeft={scrollLeft} />

          {/* Scrubbing Playhead Needle */}
          <Playhead timelineHeight={timelineHeight} />

          {/* Magnetic Vertical Snap Guide Line */}
          {snapGuideX !== null && (
            <div
              style={{ left: `${snapGuideX * zoom}px`, height: `${timelineHeight}px` }}
              className="pointer-events-none absolute top-0 z-40 w-px bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            >
              <div className="absolute top-0 -left-1.5 h-3 w-3 rounded-full bg-cyan-400" />
            </div>
          )}

          {/* Multi-Track Rows and Clip Drop Targets */}
          <div style={{ width: `${(duration + 15) * zoom}px` }} className="relative">
            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id);
              const isTrackEmpty = trackClips.length === 0;

              return (
                <div
                  key={track.id}
                  data-track-id={track.id}
                  className="relative h-16 border-b border-neutral-200 bg-white/70 hover:bg-white transition-colors dark:border-[#222226] dark:bg-[#0c0c0e]/80 dark:hover:bg-[#141418]"
                >
                  {/* Empty Track Dashed Dropzone */}
                  {isTrackEmpty && (
                    <div className="pointer-events-none absolute inset-x-3 inset-y-2 flex items-center justify-center rounded-lg border border-dashed border-neutral-300 text-[10px] text-neutral-400 dark:border-neutral-800 dark:text-neutral-600">
                      Empty {track.type} track — Drag clips here or add from left panel
                    </div>
                  )}

                  {/* Render Track Clips */}
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

export default Timeline;
