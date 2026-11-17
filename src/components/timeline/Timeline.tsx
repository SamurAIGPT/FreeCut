import React, { useRef, useState } from 'react';
import { 
  Magnet, Plus, Scissors, Trash2, ZoomIn, ZoomOut, MousePointer, 
  Copy, Link2, Bookmark, Sparkles, AlignLeft, AlignRight, Maximize2, Layers 
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
    <div className="flex h-64 sm:h-72 lg:h-80 w-full shrink-0 flex-col border-t border-app-border bg-app-bg select-none transition-colors duration-200">
      {/* Timeline Pro Control Bar */}
      <div className="flex h-11 w-full items-center justify-between border-b border-app-border bg-app-surface px-3">
        {/* Left Section: Icon Editing Tools with Hover Tooltips */}
        <div className="flex items-center gap-1">
          {/* Select Tool (V) */}
          <Tooltip content="Selection Tool" shortcut="V" side="top">
            <button
              onClick={() => setActiveTool('select')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                activeTool === 'select'
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold shadow-xs'
                  : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Razor Tool (C) */}
          <Tooltip content="Razor Tool" shortcut="C" side="top">
            <button
              onClick={() => setActiveTool('razor')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                activeTool === 'razor'
                  ? 'border-red-500 bg-red-500/15 text-red-500 font-semibold shadow-xs'
                  : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div className="mx-1 h-5 w-px bg-app-border" />

          {/* Split at Playhead (S) */}
          <Tooltip content="Split element" shortcut="S" side="top">
            <button
              onClick={() => selectedClipId && splitClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-app-text hover:bg-app-surface disabled:opacity-30 transition"
            >
              <Scissors className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Split Left (Q) */}
          <Tooltip content="Split left (Trim start)" shortcut="Q" side="top">
            <button
              onClick={() => selectedClipId && splitLeft(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-app-text hover:bg-app-surface disabled:opacity-30 transition"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Split Right (W) */}
          <Tooltip content="Split right (Trim end)" shortcut="W" side="top">
            <button
              onClick={() => selectedClipId && splitRight(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-app-text hover:bg-app-surface disabled:opacity-30 transition"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Separate / Extract Audio from Video */}
          <Tooltip content={isVideoSelected ? "Extract / Separate audio" : "Select video to extract audio"} side="top">
            <button
              onClick={() => selectedClipId && isVideoSelected && extractAudio(selectedClipId)}
              disabled={!selectedClipId || !isVideoSelected}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-30 transition"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Duplicate Clip (Ctrl+D) */}
          <Tooltip content="Duplicate element" shortcut="Ctrl+D" side="top">
            <button
              onClick={() => selectedClipId && duplicateClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-app-text hover:bg-app-surface disabled:opacity-30 transition"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Ripple Delete (Shift+Del) */}
          <Tooltip content="Ripple delete (Close gap)" shortcut="Shift+Del" side="top">
            <button
              onClick={() => selectedClipId && rippleDelete(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-amber-500 hover:bg-amber-500/10 disabled:opacity-30 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Delete (Del) */}
          <Tooltip content="Delete element" shortcut="Del" side="top">
            <button
              onClick={() => selectedClipId && deleteClip(selectedClipId)}
              disabled={!selectedClipId}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div className="mx-1 h-5 w-px bg-app-border" />

          {/* Add Bookmark / Marker (M) */}
          <Tooltip content="Add marker at needle" shortcut="M" side="top">
            <button
              onClick={() => addMarker(playhead)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-elevated text-blue-500 hover:bg-app-surface transition"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          {/* Magnet Snapping Toggle */}
          <Tooltip content={isSnapping ? "Magnet snapping ON" : "Magnet snapping OFF"} side="top">
            <button
              onClick={toggleSnapping}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                isSnapping
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-black font-semibold shadow-xs'
                  : 'border-app-border bg-app-elevated text-app-text-muted hover:text-app-text hover:bg-app-surface'
              }`}
            >
              <Magnet className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <div className="mx-1 h-5 w-px bg-app-border" />

          {/* Quick Add Track Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <Tooltip content="Add Video Track" side="top">
              <button
                onClick={() => addTrack('video')}
                className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 h-8 text-[11px] font-semibold text-blue-500 hover:bg-blue-500/10 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Video</span>
              </button>
            </Tooltip>

            <Tooltip content="Add Audio Track" side="top">
              <button
                onClick={() => addTrack('audio')}
                className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 h-8 text-[11px] font-semibold text-emerald-500 hover:bg-emerald-500/10 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Audio</span>
              </button>
            </Tooltip>

            <Tooltip content="Add Text Track" side="top">
              <button
                onClick={() => addTrack('text')}
                className="flex items-center gap-1 rounded-lg border border-app-border bg-app-elevated px-2 h-8 text-[11px] font-semibold text-amber-500 hover:bg-amber-500/10 transition"
              >
                <Plus className="h-3 w-3" />
                <span>Text</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Right Section: Zoom & Scale Controls with Tooltips */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content="Fit timeline to screen" side="top">
            <button
              onClick={handleFitToZoom}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </Tooltip>

          <Tooltip content="Zoom Out" side="top">
            <button
              onClick={() => setZoom(zoom - 20)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
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
            className="w-20 accent-neutral-800 dark:accent-neutral-200"
          />

          <Tooltip content="Zoom In" side="top">
            <button
              onClick={() => setZoom(zoom + 20)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tracks & Ruler Grid Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Track Headers Column */}
        <div className="flex w-72 shrink-0 flex-col border-r border-app-border bg-app-surface">
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
                  className={`relative h-16 border-b border-app-border/80 transition-colors ${
                    track.type === 'video'
                      ? 'bg-blue-500/[0.03] dark:bg-blue-950/[0.12] hover:bg-blue-500/[0.06] dark:hover:bg-blue-950/[0.18]'
                      : track.type === 'audio'
                      ? 'bg-emerald-500/[0.03] dark:bg-emerald-950/[0.12] hover:bg-emerald-500/[0.06] dark:hover:bg-emerald-950/[0.18]'
                      : 'bg-amber-500/[0.03] dark:bg-amber-950/[0.12] hover:bg-amber-500/[0.06] dark:hover:bg-amber-950/[0.18]'
                  }`}
                >
                  {/* Empty Track Dashed Dropzone */}
                  {isTrackEmpty && (
                    <div className="pointer-events-none absolute inset-x-3 inset-y-2 flex items-center justify-center rounded-lg border border-dashed border-app-border/60 dark:border-neutral-800 text-[10px] font-medium text-app-text-muted/60 dark:text-neutral-500 bg-app-surface/20 dark:bg-neutral-900/10">
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
