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
  delay = 150,
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
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
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
          className={`pointer-events-none absolute z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md border border-neutral-700/80 bg-neutral-900/95 dark:border-neutral-800 dark:bg-black/95 px-2 py-1 text-[11px] font-medium text-white shadow-xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95 ${positionClasses}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="rounded bg-neutral-800 px-1.5 py-0.2 font-mono text-[9px] text-neutral-300 border border-neutral-700/60 shadow-xs">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
