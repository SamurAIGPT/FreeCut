import React, { useState } from 'react';
import { Download, Redo2, Scissors, Undo2, Film, Sparkles } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/utils/time';
import { ExportModal } from './ExportModal';

export const Header: React.FC = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const projectTitle = useEditorStore((s) => s.projectTitle);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const playhead = useEditorStore((s) => s.playhead);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);

  return (
    <>
      <header className="flex h-13 w-full items-center justify-between border-b border-[#1f242e] bg-[#0c0e12] px-4 py-2 select-none">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-blue-500/25">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Free<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Cut</span>
              <span className="ml-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-blue-400">
                STUDIO
              </span>
            </span>
          </div>

          <div className="h-4 w-px bg-[#232938]" />

          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-[#232938] hover:bg-[#12141a] focus:border-blue-500/50 focus:bg-[#12141a] focus:outline-none transition"
          />
        </div>

        {/* Center: Playhead Timecode & Undo/Redo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-[#232938] bg-[#090b0e] p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded-lg p-1 text-slate-400 hover:bg-[#181c24] hover:text-white disabled:opacity-30 transition"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="rounded-lg p-1 text-slate-400 hover:bg-[#181c24] hover:text-white disabled:opacity-30 transition"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#232938] bg-[#090b0e] px-3 py-1 shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-widest text-cyan-400">
              {formatTimecode(playhead)}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Video</span>
          </button>
        </div>
      </header>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
