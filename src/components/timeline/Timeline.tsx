import React, { useRef, useState } from 'react';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer, 
  Copy, Link2, Bookmark, Sparkles, MoveHorizontal, Maximize2, Layers 
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
  const splitLeft = useEditorStore((s) => s.splitLeft);
  const splitRight = useEditorStore((s) => s.splitRight);
  const duplicateClip = useEditorStore((s) => s.duplicateClip);
  const extractAudio = useEditorStore((s) => s.extractAudio);
  const rippleDelete = useEditorStore((s) => s.rippleDelete);
  const deleteClip = useEditorStore((s) => s.deleteClip);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const isSnapping = useEditorStore((s) => s.isSnapping);
  const toggleSnapping = useEditorStore((s) => s.toggleSnapping);
  const isRippleMode = useEditorStore((s) => s.isRippleMode);
  const toggleRippleMode = useEditorStore((s) => s.toggleRippleMode);
  const addTrack = useEditorStore((s) => s.addTrack);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const duration = useEditorStore((s) => s.duration);
  const playhead = useEditorStore((s) => s.playhead);
  const addMarker = useEditorStore((s) => s.addMarker);
  const snapGuideX = useEditorStore((s) => s.snapGuideX);

  const selectedClip = clips.find((c) => c.id === selectedClipId);
  const isVideoSelected = selectedClip?.type === 'video';

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleFitToZoom = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 50;
    const newZoom = Math.max(30, Math.min(250, containerWidth / (duration || 15)));
    setZoom(Math.round(newZoom));
  };

  const timelineHeight = tracks.length * 64 + 32;

  return (
    <div className="flex h-80 w-full flex-col border-t border-app-border bg-app-bg select-none transition-colors duration-200">
      {/* Timeline Pro Control Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-app-border bg-app-surface px-3">
        {/* Left Section: Editing Tools */}
        <div className="flex items-center gap-1">
          {/* Select Tool (V) */}
          <button
            onClick={() => setActiveTool('select')}
            title="Selection Tool (V)"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeTool === 'select'
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold shadow-xs'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Select</span>
          </button>

          {/* Razor Tool (C) */}
          <button
            onClick={() => setActiveTool('razor')}
            title="Razor Tool (C) — Click clip to cut"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              activeTool === 'razor'
                ? 'border-red-500 bg-red-500/15 text-red-500 font-semibold'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Razor</span>
          </button>

          <div className="mx-1 h-4 w-px bg-app-border" />

          {/* Split at Playhead (S) */}
          <button
            onClick={() => selectedClipId && splitClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Clip at Playhead (S)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-app-text hover:bg-app-surface disabled:opacity-30 transition"
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="text-[11px]">Split</span>
          </button>

          {/* Split Left (Q) */}
          <button
            onClick={() => selectedClipId && splitLeft(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Left / Trim Start to Playhead (Q)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-app-text hover:bg-app-surface disabled:opacity-30 transition"
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
            <span className="text-[11px]">Left (Q)</span>
          </button>

          {/* Split Right (W) */}
          <button
            onClick={() => selectedClipId && splitRight(selectedClipId)}
            disabled={!selectedClipId}
            title="Split Right / Trim End to Playhead (W)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-app-text hover:bg-app-surface disabled:opacity-30 transition"
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
            <span className="text-[11px]">Right (W)</span>
          </button>

          {/* Separate Audio from Video */}
          <button
            onClick={() => selectedClipId && isVideoSelected && extractAudio(selectedClipId)}
            disabled={!selectedClipId || !isVideoSelected}
            title="Separate / Extract Audio to Independent Track"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-30 transition"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden md:inline">Extract Audio</span>
          </button>

          {/* Duplicate Clip (Ctrl+D) */}
          <button
            onClick={() => selectedClipId && duplicateClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Duplicate Selected Clip (Ctrl+D)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-app-text hover:bg-app-surface disabled:opacity-30 transition"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden lg:inline">Duplicate</span>
          </button>

          {/* Ripple Delete (Shift+Del) */}
          <button
            onClick={() => selectedClipId && rippleDelete(selectedClipId)}
            disabled={!selectedClipId}
            title="Ripple Delete: Remove clip and close gap (Shift+Del)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] hidden lg:inline">Ripple Del</span>
          </button>

          {/* Delete (Del) */}
          <button
            onClick={() => selectedClipId && deleteClip(selectedClipId)}
            disabled={!selectedClipId}
            title="Delete Selected Clip (Del)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-app-border" />

          {/* Add Bookmark / Marker (M) */}
          <button
            onClick={() => addMarker(playhead)}
            title="Add Marker at Current Time (M)"
            className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 py-1 text-xs font-medium text-app-text hover:bg-app-surface transition"
          >
            <Bookmark className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[11px] hidden sm:inline">Marker</span>
          </button>

          {/* Magnet Snapping Toggle */}
          <button
            onClick={toggleSnapping}
            title={isSnapping ? 'Magnet Snapping ON (Click to disable)' : 'Magnet Snapping OFF (Click to enable)'}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition ${
              isSnapping
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold'
                : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
            }`}
          >
            <Magnet className="h-3.5 w-3.5" />
            <span className="text-[11px]">Snap</span>
          </button>

          {/* Quick Add Track Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => addTrack('video')}
              title="Add Video Track"
              className="flex items-center gap-1 rounded-md border border-app-border bg-app-elevated px-2 py-0.5 text-[11px] text-blue-500 hover:bg-blue-500/10 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Video</span>
            </button>
            <button
              onClick={() => addTrack('audio')}
              title="Add Audio Track"
              className="flex items-center gap-1 rounded-md border border-app-border bg-app-elevated px-2 py-0.5 text-[11px] text-emerald-500 hover:bg-emerald-500/10 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => addTrack('text')}
              title="Add Text Track"
              className="flex items-center gap-1 rounded-md border border-app-border bg-app-elevated px-2 py-0.5 text-[11px] text-amber-500 hover:bg-amber-500/10 transition"
            >
              <Plus className="h-3 w-3" />
              <span>Text</span>
            </button>
          </div>
        </div>

        {/* Right Section: Zoom & Scale Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleFitToZoom}
            title="Fit Timeline to Screen"
            className="rounded p-1 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(zoom - 20)}
            title="Zoom Out"
            className="rounded p-1 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={25}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-20 accent-neutral-800 dark:accent-neutral-200"
          />
          <button
            onClick={() => setZoom(zoom + 20)}
            title="Zoom In"
            className="rounded p-1 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks & Ruler Grid Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Track Headers Column */}
        <div className="flex w-60 shrink-0 flex-col border-r border-app-border bg-app-surface">
          <div className="h-8 border-b border-app-border bg-app-surface flex items-center justify-between px-3 text-[10px] font-semibold tracking-wider text-app-text-muted uppercase">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Tracks ({tracks.length})</span>
            </div>
            <span className="font-mono text-[9px] lowercase opacity-60">scroll ↕</span>
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
                  className={`relative h-16 border-b border-app-border/60 transition ${
                    track.type === 'video'
                      ? 'bg-blue-500/[0.02] hover:bg-blue-500/[0.05]'
                      : track.type === 'audio'
                      ? 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.05]'
                      : 'bg-amber-500/[0.02] hover:bg-amber-500/[0.05]'
                  }`}
                >
                  {/* Empty Track Dashed Dropzone */}
                  {isTrackEmpty && (
                    <div className="pointer-events-none absolute inset-x-3 inset-y-2 flex items-center justify-center rounded-lg border border-dashed border-app-border/40 text-[10px] text-app-text-muted/60">
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
