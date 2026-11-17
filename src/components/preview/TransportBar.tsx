import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/utils/time';

export const TransportBar: React.FC = () => {
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const togglePlay = useEditorStore((s) => s.togglePlay);
  const playhead = useEditorStore((s) => s.playhead);
  const duration = useEditorStore((s) => s.duration);
  const setPlayhead = useEditorStore((s) => s.setPlayhead);

  const stepFrame = (frames: number) => {
    setPlayhead(playhead + frames * (1 / 30));
  };

  return (
    <div className="flex h-12 w-full items-center justify-between border-t border-app-border bg-app-surface px-4 select-none transition-colors duration-200">
      {/* Left: Time indicator */}
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className="font-semibold text-app-text">{formatTimecode(playhead)}</span>
        <span className="text-app-text-muted">/</span>
        <span className="text-app-text-muted">{formatTimecode(duration)}</span>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPlayhead(0)}
          title="Jump to Start"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => stepFrame(-1)}
          title="Step 1 Frame Back (Left Arrow)"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          title="Play / Pause (Space)"
          className="mx-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black shadow-sm hover:opacity-90 active:scale-95 transition"
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
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => setPlayhead(duration)}
          title="Jump to End"
          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-elevated hover:text-app-text transition"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Shortcuts Guide */}
      <div className="flex items-center gap-2 text-[11px] text-app-text-muted">
        <span>
          <kbd className="rounded bg-app-elevated px-1.5 py-0.5 font-mono text-[10px] text-app-text border border-app-border">Space</kbd> Play
        </span>
        <span>•</span>
        <span>
          <kbd className="rounded bg-app-elevated px-1.5 py-0.5 font-mono text-[10px] text-app-text border border-app-border">S</kbd> Cut
        </span>
        <span>•</span>
        <span>
          <kbd className="rounded bg-app-elevated px-1.5 py-0.5 font-mono text-[10px] text-app-text border border-app-border">Del</kbd> Remove
        </span>
      </div>
    </div>
  );
};
