import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Gauge,
  Film,
  ZoomIn,
  Maximize,
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/utils/time';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { AspectRatio } from '@/types/editor';
import { GuidePopover } from './GuidePopover';

const ASPECT_OPTIONS: SelectOption<AspectRatio>[] = [
  { value: '16:9', label: '16:9 Landscape', shortLabel: '16:9', description: 'YouTube & Desktop standard' },
  { value: '9:16', label: '9:16 Shorts / Reels', shortLabel: '9:16', description: 'TikTok, Reels, Shorts' },
  { value: '1:1', label: '1:1 Square', shortLabel: '1:1', description: 'Instagram Feed' },
  { value: '4:5', label: '4:5 Portrait', shortLabel: '4:5', description: 'Social Feed' },
  { value: '21:9', label: '21:9 UltraWide', shortLabel: '21:9', description: 'Cinematic CinemaScope' },
];

const ZOOM_OPTIONS: SelectOption<number>[] = [
  { value: 0, label: 'Fit' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 150, label: '150%' },
  { value: 200, label: '200%' },
];

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];

interface TransportBarProps {
  onToggleFullscreen?: () => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({ onToggleFullscreen }) => {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const fps = useEditorStore((s) => s.fps || 30);
  const isMasterMuted = useEditorStore((s) => s.isMasterMuted);
  const toggleMasterMuted = useEditorStore((s) => s.toggleMasterMuted);
  const playbackRate = useEditorStore((s) => s.playbackRate || 1);
  const setPlaybackRate = useEditorStore((s) => s.setPlaybackRate);

  const aspect = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const canvasZoom = useEditorStore((s) => s.canvasZoom);
  const setCanvasZoom = useEditorStore((s) => s.setCanvasZoom);

  const [isEditingTimecode, setIsEditingTimecode] = useState(false);
  const [timecodeInput, setTimecodeInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const stepFrame = (frames: number) => {
    setPlayhead(playhead + frames * (1 / fps));
  };

  const handleStartEditingTimecode = () => {
    setTimecodeInput(formatTimecode(playhead, fps));
    setIsEditingTimecode(true);
  };

  useEffect(() => {
    if (isEditingTimecode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTimecode]);

  const handleCommitTimecode = () => {
    setIsEditingTimecode(false);
    const text = timecodeInput.trim();
    if (!text) return;

    // Check for HH:MM:SS:FF or HH:MM:SS
    const parts = text.split(':').map((p) => Number(p));
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      const [h, m, s, f] = parts;
      const totalSeconds = h * 3600 + m * 60 + s + f / fps;
      setPlayhead(totalSeconds);
      return;
    }
    if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
      const [h, m, s] = parts;
      const totalSeconds = h * 3600 + m * 60 + s;
      setPlayhead(totalSeconds);
      return;
    }
    if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
      const [m, s] = parts;
      const totalSeconds = m * 60 + s;
      setPlayhead(totalSeconds);
      return;
    }

    // Direct decimal number (e.g. "4.5")
    const num = parseFloat(text);
    if (!isNaN(num)) {
      setPlayhead(num);
    }
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackRate(PLAYBACK_SPEEDS[nextIndex]);
  };

  return (
    <div className="flex h-11 w-full items-center justify-between border-t border-app-border bg-app-surface px-2.5 sm:px-3 select-none transition-colors duration-200">
      {/* Left: SMPTE Frame Timecode & Aspect Ratio Selection */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
          {isEditingTimecode ? (
            <input
              ref={inputRef}
              type="text"
              value={timecodeInput}
              onChange={(e) => setTimecodeInput(e.target.value)}
              onBlur={handleCommitTimecode}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitTimecode();
                if (e.key === 'Escape') setIsEditingTimecode(false);
              }}
              className="w-24 rounded border border-blue-500 bg-app-elevated px-1 py-0.5 text-xs font-semibold text-app-text outline-none text-center"
            />
          ) : (
            <button
              onClick={handleStartEditingTimecode}
              title="Click to jump to timecode (HH:MM:SS:FF)"
              className="font-semibold text-app-text hover:text-blue-500 hover:bg-app-elevated px-1.5 py-0.5 rounded transition cursor-pointer"
            >
              {formatTimecode(playhead, fps)}
            </button>
          )}
          <span className="text-app-text-muted">/</span>
          <span className="text-app-text-muted px-0.5">{formatTimecode(duration, fps)}</span>
        </div>

        <div className="h-4 w-px bg-app-border hidden sm:block" />

        {/* Aspect Ratio Selector (Moved down from above video) */}
        <CustomSelect<AspectRatio>
          value={aspect}
          onChange={(val) => setAspectRatio(val)}
          options={ASPECT_OPTIONS}
          size="sm"
          icon={<Film className="h-3 w-3" />}
          className="w-20"
        />
      </div>

      {/* Center: Transport Playback Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPlayhead(0)}
          title="Jump to Start (Home)"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => stepFrame(-1)}
          title="Step 1 Frame Back (Left Arrow)"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          title="Play / Pause (Space)"
          className="mx-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
          )}
        </button>

        <button
          onClick={() => stepFrame(1)}
          title="Step 1 Frame Forward (Right Arrow)"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => setPlayhead(duration)}
          title="Jump to End (End)"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Speed, Volume, Zoom, Guides, Fullscreen (Replaced useless shortcut text) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Playback Speed selector */}
        <button
          onClick={cyclePlaybackRate}
          title={`Playback Speed: ${playbackRate}x (Click to cycle)`}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-mono font-medium text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
        >
          <Gauge className="h-3 w-3" />
          <span>{playbackRate}x</span>
        </button>

        {/* Master Mute / Volume toggle */}
        <button
          onClick={toggleMasterMuted}
          title={isMasterMuted ? 'Unmute Audio' : 'Mute Audio'}
          className={`rounded-lg p-1.5 transition cursor-pointer ${
            isMasterMuted
              ? 'text-red-500 bg-red-500/10'
              : 'text-app-text-muted hover:bg-app-elevated hover:text-app-text'
          }`}
        >
          {isMasterMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        <div className="h-4 w-px bg-app-border" />

        {/* Zoom Selector (Fit, 25%, 50%, etc. - Moved down from above video) */}
        <CustomSelect<number>
          value={canvasZoom}
          onChange={(val) => setCanvasZoom(val)}
          options={ZOOM_OPTIONS}
          size="sm"
          icon={<ZoomIn className="h-3 w-3" />}
          className="w-20"
        />

        {/* Guides & Safe Zones Popover (Moved down from above video) */}
        <GuidePopover placement="top" />

        {/* Fullscreen Toggle (Moved down from above video) */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen"
            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition cursor-pointer"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
