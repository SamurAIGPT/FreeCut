import React from 'react';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
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
    <div className="flex h-12 w-full items-center justify-between border-t border-[#1f242e] bg-[#0c0e12] px-4 select-none">
      {/* Left: Time indicator */}
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className="font-semibold text-white">{formatTimecode(playhead)}</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-500">{formatTimecode(duration)}</span>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setPlayhead(0)}
          title="Jump to Start"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#181c24] hover:text-white transition"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        <button
          onClick={() => stepFrame(-1)}
          title="Step 1 Frame Back (Left Arrow)"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#181c24] hover:text-white transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={togglePlay}
          title="Play / Pause (Space)"
          className="mx-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 fill-white" />
          ) : (
            <Play className="ml-0.5 h-4 w-4 fill-white" />
          )}
        </button>

        <button
          onClick={() => stepFrame(1)}
          title="Step 1 Frame Forward (Right Arrow)"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#181c24] hover:text-white transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={() => setPlayhead(duration)}
          title="Jump to End"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-[#181c24] hover:text-white transition"
        >
          <SkipForward className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Shortcuts Guide */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span>
          <kbd className="rounded bg-[#1a1f2b] px-1.5 py-0.5 font-mono text-[10px] text-slate-300">Space</kbd> Play
        </span>
        <span>•</span>
        <span>
          <kbd className="rounded bg-[#1a1f2b] px-1.5 py-0.5 font-mono text-[10px] text-slate-300">S</kbd> Cut
        </span>
        <span>•</span>
        <span>
          <kbd className="rounded bg-[#1a1f2b] px-1.5 py-0.5 font-mono text-[10px] text-slate-300">Del</kbd> Remove
        </span>
      </div>
    </div>
  );
};
