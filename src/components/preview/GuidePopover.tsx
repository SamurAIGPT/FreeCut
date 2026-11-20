import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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

interface GuidePopoverProps {
  placement?: 'top' | 'bottom';
}

interface DropdownCoords {
  top?: number;
  bottom?: number;
  right: number;
  width: number;
  maxHeight: number;
}

export const GuidePopover: React.FC<GuidePopoverProps> = ({ placement = 'top' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeGuide = useEditorStore((s) => s.activeGuide || (s.showGrid ? 'grid' : 'none'));
  const setActiveGuide = useEditorStore((s) => s.setActiveGuide);
  const gridConfig = useEditorStore((s) => s.gridConfig || { rows: 3, cols: 3 });
  const setGridConfig = useEditorStore((s) => s.setGridConfig);

  // Compute position relative to viewport with overflow escaping via portal
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceAbove = rect.top - 12;
    const spaceBelow = viewportHeight - rect.bottom - 12;

    // Smart placement: if requested top, open upwards unless space above is too tight
    const shouldOpenUpwards = placement === 'top' ? spaceAbove >= 200 || spaceAbove >= spaceBelow : spaceBelow < 200 && spaceAbove > spaceBelow;

    let top: number | undefined;
    let bottom: number | undefined;
    let maxHeight = 480;

    if (shouldOpenUpwards) {
      bottom = viewportHeight - rect.top + 6;
      maxHeight = Math.max(160, Math.min(480, spaceAbove));
    } else {
      top = rect.bottom + 6;
      maxHeight = Math.max(160, Math.min(480, spaceBelow));
    }

    const right = Math.max(12, viewportWidth - rect.right);

    setCoords({
      top,
      bottom,
      right,
      width: 260,
      maxHeight,
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, activeGuide, gridConfig]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResizeOrScroll = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isGuideActive = activeGuide !== 'none';

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Guides & Safe Zones"
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition text-xs font-medium cursor-pointer ${
          isGuideActive
            ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <Grid className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {activeGuide === 'none' ? 'Guides' : activeGuide === 'grid' ? `${gridConfig.rows}×${gridConfig.cols}` : activeGuide.toUpperCase()}
        </span>
      </button>

      {/* Portaled Popover Panel - Escapes parent overflow-hidden and clamps to viewport */}
      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              right: `${coords.right}px`,
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 9999,
            }}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141417] p-3 shadow-2xl text-neutral-900 dark:text-neutral-100 flex flex-col overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="sticky top-0 -mt-1 pt-1 pb-2 mb-2 bg-white dark:bg-[#141417] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between z-10 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Guides &amp; Safe Zones
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Overlay</span>
            </div>

            {/* Guide selection list */}
            <div className="flex flex-col gap-1 shrink-0">
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
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/30'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {opt.icon}
                      <div>
                        <div className="font-medium leading-none">{opt.label}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{opt.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Grid Configuration Options (when Grid is active) */}
            {activeGuide === 'grid' && (
              <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  <Sliders className="h-3 w-3" />
                  <span>Grid Configuration</span>
                </div>

                {/* Rows */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Rows</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGridConfig({ rows: Math.max(2, gridConfig.rows - 1) })}
                      className="h-5 w-5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono font-semibold">{gridConfig.rows}</span>
                    <button
                      onClick={() => setGridConfig({ rows: Math.min(8, gridConfig.rows + 1) })}
                      className="h-5 w-5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Columns */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Columns</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setGridConfig({ cols: Math.max(2, gridConfig.cols - 1) })}
                      className="h-5 w-5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono font-semibold">{gridConfig.cols}</span>
                    <button
                      onClick={() => setGridConfig({ cols: Math.min(8, gridConfig.cols + 1) })}
                      className="h-5 w-5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Quick Reset to 3x3 */}
                {(gridConfig.rows !== 3 || gridConfig.cols !== 3) && (
                  <button
                    onClick={() => setGridConfig({ rows: 3, cols: 3 })}
                    className="mt-1 text-center text-[10px] text-blue-500 hover:underline cursor-pointer"
                  >
                    Reset to Rule of Thirds (3×3)
                  </button>
                )}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
