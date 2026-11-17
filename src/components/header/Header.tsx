import React, { useState } from 'react';
import { Download, Redo2, Scissors, Undo2 } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/utils/time';
import { AspectRatio } from '@/types/editor';
import { ExportModal } from './ExportModal';

export const Header: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const projectTitle = useEditorStore((s) => s.projectTitle);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const playhead = useEditorStore((s) => s.playhead);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);

  return (
    <>
      <header className="flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              Free<span className="text-primary">Cut</span>
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="rounded bg-transparent px-2 py-1 text-sm font-medium text-slate-200 hover:bg-surface-elevated focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Center: Playhead Timecode & Undo/Redo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-[#090b0e] px-1 py-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="rounded p-1.5 text-slate-400 hover:bg-surface-elevated hover:text-white disabled:opacity-30"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-lg border border-border bg-[#090b0e] px-3 py-1 font-mono text-xs font-semibold tracking-wider text-blue-400">
            {formatTimecode(playhead)}
          </div>
        </div>

        {/* Right: Aspect Ratio & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Canvas:</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="16:9">16:9 Landscape</option>
              <option value="9:16">9:16 Shorts/Reels</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-primary-hover active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </header>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
