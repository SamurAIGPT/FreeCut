import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [coords, setCoords] = useState<{ top: number; left: number; transform: string }>({
    top: 0,
    left: 0,
    transform: '',
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;
    let transform = '';

    switch (side) {
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        transform = 'translateY(-50%)';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        transform = 'translate(-100%, -50%)';
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'top':
      default:
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, -100%)';
        break;
    }

    // Viewport Boundary Clamping so it never overflows below or off screen
    if (typeof window !== 'undefined') {
      const padding = 8;
      // Prevent overflow below bottom of screen
      if (side === 'right' || side === 'left') {
        const estimatedHeight = 32;
        const maxTop = window.innerHeight - estimatedHeight - padding;
        if (top > maxTop) {
          top = maxTop;
        } else if (top < padding + estimatedHeight / 2) {
          top = padding + estimatedHeight / 2;
        }
      }
    }

    setCoords({ top, left, transform });
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
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

  // Update position on scroll/resize if open
  useEffect(() => {
    if (!isVisible) return;
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-flex items-center justify-center ${className}`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>

      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.transform,
              zIndex: 99999,
            }}
            className="pointer-events-none flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium shadow-xl transition-opacity duration-100 animate-in fade-in zoom-in-95 bg-neutral-900 text-white border-neutral-800 dark:bg-white dark:text-neutral-900 dark:border-neutral-200"
          >
            <span>
              {content}
              {shortcut && (
                <span className="ml-1.5 font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                  ({shortcut})
                </span>
              )}
            </span>

            {/* Directional Arrow Pointers */}
            {side === 'right' && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-[4px] border-r-[4px] border-y-transparent border-r-neutral-900 dark:border-r-white" />
            )}
            {side === 'left' && (
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[4px] border-y-transparent border-l-neutral-900 dark:border-l-white" />
            )}
            {side === 'top' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-[4px] border-t-[4px] border-x-transparent border-t-neutral-900 dark:border-t-white" />
            )}
            {side === 'bottom' && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-x-[4px] border-b-[4px] border-x-transparent border-b-neutral-900 dark:border-b-white" />
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
