import React, { useState, useRef, useEffect, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';

// Global singleton listener so only ONE tooltip is visible across the entire app
let activeTooltipId: string | null = null;
const tooltipListeners = new Set<(activeId: string | null) => void>();

function setActiveTooltip(id: string | null) {
  activeTooltipId = id;
  tooltipListeners.forEach((listener) => listener(id));
}

// Global click listener to close active tooltip on click
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    if (activeTooltipId !== null) {
      setActiveTooltip(null);
    }
  });
}

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
  const instanceId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    transform: string;
    arrowStyle?: React.CSSProperties;
  }>({
    top: 0,
    left: 0,
    transform: '',
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to global singleton tooltip manager
  useEffect(() => {
    const listener = (activeId: string | null) => {
      if (activeId !== instanceId) {
        setIsVisible(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };
    tooltipListeners.add(listener);
    return () => {
      tooltipListeners.delete(listener);
    };
  }, [instanceId]);

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

    setCoords({ top, left, transform });
  };

  // Viewport clamping & arrow alignment adjustment after DOM measurement
  useLayoutEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltipEl = tooltipRef.current;
    const triggerEl = triggerRef.current;
    const tRect = tooltipEl.getBoundingClientRect();
    const trRect = triggerEl.getBoundingClientRect();
    const padding = 10;

    let newTop = coords.top;
    let newLeft = coords.left;
    let arrowStyle: React.CSSProperties = {};

    if (side === 'top' || side === 'bottom') {
      const triggerCenterX = trRect.left + trRect.width / 2;

      // Check overflow on right screen edge
      if (tRect.right > window.innerWidth - padding) {
        const overflow = tRect.right - (window.innerWidth - padding);
        newLeft -= overflow;
      }
      // Check underflow on left screen edge
      if (tRect.left < padding) {
        const underflow = padding - tRect.left;
        newLeft += underflow;
      }

      // Re-calculate arrow position relative to tooltip box so it points to trigger center
      if (newLeft !== coords.left) {
        // Box left edge on screen is (newLeft - tRect.width / 2)
        const boxLeft = newLeft - tRect.width / 2;
        const relativeArrowLeft = triggerCenterX - boxLeft;
        // Clamp arrow within tooltip borders
        const clampedArrowLeft = Math.max(8, Math.min(tRect.width - 8, relativeArrowLeft));
        arrowStyle = {
          left: `${clampedArrowLeft}px`,
          transform: 'translateX(-50%)',
        };
      }
    } else if (side === 'left' || side === 'right') {
      const triggerCenterY = trRect.top + trRect.height / 2;

      // Check overflow on bottom screen edge
      if (tRect.bottom > window.innerHeight - padding) {
        const overflow = tRect.bottom - (window.innerHeight - padding);
        newTop -= overflow;
      }
      // Check underflow on top screen edge
      if (tRect.top < padding) {
        const underflow = padding - tRect.top;
        newTop += underflow;
      }

      // Re-calculate arrow position relative to tooltip box so it points to trigger center
      if (newTop !== coords.top) {
        const boxTop = newTop - tRect.height / 2;
        const relativeArrowTop = triggerCenterY - boxTop;
        const clampedArrowTop = Math.max(6, Math.min(tRect.height - 6, relativeArrowTop));
        arrowStyle = {
          top: `${clampedArrowTop}px`,
          transform: 'translateY(-50%)',
        };
      }
    }

    if (newTop !== coords.top || newLeft !== coords.left || Object.keys(arrowStyle).length > 0) {
      setCoords((prev) => ({
        ...prev,
        top: newTop,
        left: newLeft,
        arrowStyle,
      }));
    }
  }, [isVisible, side]);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setActiveTooltip(instanceId);
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (activeTooltipId === instanceId) {
      setActiveTooltip(null);
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
        onClick={hideTooltip}
      >
        {children}
      </div>

      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
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

            {/* Directional Arrow Pointers with Dynamic Clamped Position */}
            {side === 'right' && (
              <span
                style={coords.arrowStyle || { top: '50%', transform: 'translateY(-50%)' }}
                className="absolute -left-1 border-y-[4px] border-r-[4px] border-y-transparent border-r-neutral-900 dark:border-r-white"
              />
            )}
            {side === 'left' && (
              <span
                style={coords.arrowStyle || { top: '50%', transform: 'translateY(-50%)' }}
                className="absolute -right-1 border-y-[4px] border-l-[4px] border-y-transparent border-l-neutral-900 dark:border-l-white"
              />
            )}
            {side === 'top' && (
              <span
                style={coords.arrowStyle || { left: '50%', transform: 'translateX(-50%)' }}
                className="absolute -bottom-1 border-x-[4px] border-t-[4px] border-x-transparent border-t-neutral-900 dark:border-t-white"
              />
            )}
            {side === 'bottom' && (
              <span
                style={coords.arrowStyle || { left: '50%', transform: 'translateX(-50%)' }}
                className="absolute -top-1 border-x-[4px] border-b-[4px] border-x-transparent border-b-neutral-900 dark:border-b-white"
              />
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
