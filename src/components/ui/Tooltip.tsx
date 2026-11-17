import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  side = 'top',
  delay = 50,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-700/80 bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-black transition-all duration-150 animate-in fade-in zoom-in-95 ${positionClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="rounded bg-neutral-800 px-1.5 py-0.2 font-mono text-[9px] text-neutral-300 border border-neutral-700/60 shadow-xs">
              {shortcut}
            </kbd>
          )}

          {/* Directional Arrow Pointers */}
          {side === 'right' && (
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-[4px] border-r-[4px] border-y-transparent border-r-neutral-900 dark:border-r-black" />
          )}
          {side === 'left' && (
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[4px] border-y-transparent border-l-neutral-900 dark:border-l-black" />
          )}
          {side === 'top' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-[4px] border-t-[4px] border-x-transparent border-t-neutral-900 dark:border-t-black" />
          )}
          {side === 'bottom' && (
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-[4px] border-b-[4px] border-x-transparent border-b-neutral-900 dark:border-b-black" />
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
