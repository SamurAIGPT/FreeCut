import React, { useState, useRef, useEffect } from 'react';
import { Grid, EyeOff, Smartphone, Sliders, Check } from 'lucide-react';
import { useEditorStore, GuideType } from '@/store/useEditorStore';

interface GuideOption {
  id: GuideType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const GUIDE_OPTIONS: GuideOption[] = [
  {
    id: 'none',
    label: 'Off',
    description: 'No guide overlays',
    icon: <EyeOff className="h-4 w-4" />,
  },
  {
    id: 'grid',
    label: 'Grid',
    description: 'Rule of Thirds / Custom Grid',
    icon: <Grid className="h-4 w-4 text-blue-400" />,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'TikTok 9:16 UI & buttons',
    icon: <Smartphone className="h-4 w-4 text-cyan-400" />,
  },
  {
    id: 'reels',
    label: 'Reels',
    description: 'Instagram Reels safe margins',
    icon: <Smartphone className="h-4 w-4 text-pink-400" />,
  },
  {
    id: 'shorts',
    label: 'Shorts',
    description: 'YouTube Shorts safe margins',
    icon: <Smartphone className="h-4 w-4 text-red-400" />,
  },
];

export const GuidePopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeGuide = useEditorStore((s) => s.activeGuide || (s.showGrid ? 'grid' : 'none'));
  const setActiveGuide = useEditorStore((s) => s.setActiveGuide);
  const gridConfig = useEditorStore((s) => s.gridConfig || { rows: 3, cols: 3 });
  const setGridConfig = useEditorStore((s) => s.setGridConfig);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const isGuideActive = activeGuide !== 'none';

  return (
    <div ref={popoverRef} className="relative inline-block">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Guides & Safe Zones"
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition text-xs font-medium cursor-pointer ${
          isGuideActive
            ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black font-semibold shadow-sm'
            : 'text-app-text-muted hover:bg-app-elevated hover:text-app-text'
        }`}
      >
        <Grid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {activeGuide === 'none' ? 'Guides' : activeGuide === 'grid' ? `${gridConfig.rows}×${gridConfig.cols}` : activeGuide.toUpperCase()}
        </span>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-64 rounded-xl border border-app-border bg-app-surface/95 p-3 shadow-2xl backdrop-blur-md text-app-text animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-app-border">
            <span className="text-xs font-bold uppercase tracking-wider text-app-text-muted">
              Guides & Safe Zones
            </span>
            <span className="text-[10px] text-app-text-muted">Overlay</span>
          </div>

          {/* Guide selection list */}
          <div className="flex flex-col gap-1">
            {GUIDE_OPTIONS.map((opt) => {
              const isSelected = activeGuide === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setActiveGuide(opt.id);
                    if (opt.id !== 'grid') setIsOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20'
                      : 'hover:bg-app-elevated text-app-text'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {opt.icon}
                    <div>
                      <div className="font-medium leading-none">{opt.label}</div>
                      <div className="text-[10px] text-app-text-muted mt-0.5">{opt.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Grid Configuration Options (when Grid is active) */}
          {activeGuide === 'grid' && (
            <div className="mt-3 pt-2.5 border-t border-app-border flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-app-text-muted">
                <Sliders className="h-3 w-3" />
                <span>Grid Configuration</span>
              </div>

              {/* Rows */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-app-text-muted">Rows</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGridConfig({ rows: Math.max(2, gridConfig.rows - 1) })}
                    className="h-5 w-5 rounded border border-app-border bg-app-elevated flex items-center justify-center font-bold text-xs hover:bg-app-surface transition"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-semibold">{gridConfig.rows}</span>
                  <button
                    onClick={() => setGridConfig({ rows: Math.min(8, gridConfig.rows + 1) })}
                    className="h-5 w-5 rounded border border-app-border bg-app-elevated flex items-center justify-center font-bold text-xs hover:bg-app-surface transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Columns */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-app-text-muted">Columns</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setGridConfig({ cols: Math.max(2, gridConfig.cols - 1) })}
                    className="h-5 w-5 rounded border border-app-border bg-app-elevated flex items-center justify-center font-bold text-xs hover:bg-app-surface transition"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-semibold">{gridConfig.cols}</span>
                  <button
                    onClick={() => setGridConfig({ cols: Math.min(8, gridConfig.cols + 1) })}
                    className="h-5 w-5 rounded border border-app-border bg-app-elevated flex items-center justify-center font-bold text-xs hover:bg-app-surface transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Reset to 3x3 */}
              {(gridConfig.rows !== 3 || gridConfig.cols !== 3) && (
                <button
                  onClick={() => setGridConfig({ rows: 3, cols: 3 })}
                  className="mt-1 text-center text-[10px] text-blue-500 hover:underline"
                >
                  Reset to Rule of Thirds (3×3)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
