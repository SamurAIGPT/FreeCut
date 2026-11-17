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
    <div className="flex h-12 w-full items-center justify-between border-t border-border bg-[#0d0f12] px-4">
      {/* Left: Time counter */}
      <div className="font-mono text-xs text-slate-400">
        <span className="font-semibold text-white">{formatTimecode(playhead)}</span>
        <span className="mx-1 text-slate-600">/</span>
        <span>{formatTimecode(duration)}</span>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPlayhead(0)}
          title="Jump to Start"
          className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => stepFrame(-1)}
          title="Step Backward 1 Frame (Left Arrow)"
          className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          title="Play / Pause (Space)"
          className="mx-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-blue-500/20 hover:bg-primary-hover active:scale-95"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-white" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-white" />
          )}
        </button>

        <button
          onClick={() => stepFrame(1)}
          title="Step Forward 1 Frame (Right Arrow)"
          className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => setPlayhead(duration)}
          title="Jump to End"
          className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Shortcuts helper */}
      <div className="text-[11px] text-slate-500">
        <kbd className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
          Space
        </kbd>{' '}
        to play •{' '}
        <kbd className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
          S
        </kbd>{' '}
        to split
      </div>
    </div>
  );
};
