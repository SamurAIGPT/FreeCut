import React, { useState } from 'react';
import { Download, Redo2, Scissors, Undo2, Sun, Moon, ChevronLeft, Loader2, Check } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import { formatTimecode } from '@/utils/time';
import { ExportModal } from './ExportModal';

interface HeaderProps {
  onBackToProjects?: () => void;
}

const HeaderTimecode: React.FC = () => {
  const playhead = useEditorStore((s) => s.playhead);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-app-border bg-app-bg px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
      <span className="font-mono text-xs font-bold tracking-widest text-app-text">
        {formatTimecode(playhead)}
      </span>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ onBackToProjects }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const projectTitle = useEditorStore((s) => s.projectTitle);
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle);
  const isSaving = useEditorStore((s) => s.isSaving);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.history.past.length > 0);
  const canRedo = useEditorStore((s) => s.history.future.length > 0);

  return (
    <>
      <header className="flex h-12 w-full items-center justify-between border-b border-app-border bg-app-surface px-4 py-2 select-none transition-colors duration-200">
        {/* Left: Back to Projects, Brand & Project Title */}
        <div className="flex items-center gap-3">
          {onBackToProjects && (
            <button
              onClick={onBackToProjects}
              className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-elevated px-2.5 py-1 text-xs font-semibold text-app-text hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Back to Projects"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Projects</span>
            </button>
          )}

          <div
            onClick={onBackToProjects}
            className="flex items-center gap-2 cursor-pointer group"
            title="FreeCut Studio"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black font-bold shadow-sm group-hover:scale-105 transition">
              <Scissors className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-app-text hidden sm:inline">
              FreeCut
              <span className="ml-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-200/50 dark:bg-neutral-800/80 px-1.5 py-0.2 text-[9px] font-semibold text-app-text-muted">
                PRO
              </span>
            </span>
          </div>

          <div className="h-4 w-px bg-app-border" />

          {/* Project Title Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="rounded-md border border-transparent px-2 py-0.5 text-xs font-medium text-app-text hover:border-app-border hover:bg-app-elevated focus:border-neutral-400 dark:focus:border-neutral-600 focus:bg-app-elevated focus:outline-none transition max-w-[160px] sm:max-w-[220px]"
            />

            {/* Auto-save Status Indicator */}
            <div className="flex items-center gap-1 text-app-text-muted select-none" title={isSaving ? "Saving changes..." : "All changes saved locally"}>
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-app-text-muted" />
                  <span className="text-[10px] text-app-text-muted hidden md:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] text-app-text-muted hidden md:inline">Saved</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Playhead Timecode & Undo/Redo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 rounded-lg border border-app-border bg-app-elevated p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded p-1 text-app-text-muted hover:bg-app-surface hover:text-app-text disabled:opacity-30 transition"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="rounded p-1 text-app-text-muted hover:bg-app-surface hover:text-app-text disabled:opacity-30 transition"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <HeaderTimecode />
        </div>

        {/* Right: Theme Toggle & Export Button */}
        <div className="flex items-center gap-2">
          {/* Dual Theme Switcher (Obsidian Dark & Studio Light) */}
          <div className="flex items-center rounded-lg border border-app-border bg-app-elevated p-0.5">
            <button
              onClick={() => setTheme('dark')}
              title="Obsidian Dark Mode"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700 font-bold'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="text-[11px]">Dark</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              title="Studio Light Mode"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                theme === 'light'
                  ? 'bg-white text-neutral-900 shadow-sm border border-neutral-300'
                  : 'text-app-text-muted hover:text-app-text'
              }`}
            >
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px]">Light</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-neutral-900 shadow-sm hover:opacity-90 active:scale-95 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </>
  );
};
