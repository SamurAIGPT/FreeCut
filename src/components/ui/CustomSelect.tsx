import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  shortLabel?: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  icon?: React.ReactNode;
  prefix?: string;
}

interface DropdownCoords {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  menuClassName = '',
  size = 'md',
  align = 'left',
  icon,
  prefix,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<DropdownCoords | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute position relative to viewport with auto-flip when space below is limited
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    // Smart flip: open upwards if space below is tighter than 300px or space above is larger
    const shouldOpenUpwards = (spaceBelow < 300 || spaceAbove > spaceBelow + 50) && spaceAbove > 160;

    let maxHeight = 220;
    let top: number | undefined;
    let bottom: number | undefined;

    if (shouldOpenUpwards) {
      maxHeight = Math.max(100, Math.min(220, spaceAbove));
      bottom = viewportHeight - rect.top + 4;
    } else {
      maxHeight = Math.max(100, Math.min(220, spaceBelow));
      top = rect.bottom + 4;
    }

    const menuWidth = Math.max(rect.width, 180);
    let left: number | undefined;
    let right: number | undefined;

    if (align === 'right' || rect.left + menuWidth > viewportWidth - 8) {
      right = Math.max(8, viewportWidth - rect.right);
    } else {
      left = Math.max(8, rect.left);
    }

    setCoords({
      top,
      bottom,
      left,
      right,
      width: menuWidth,
      maxHeight,
      placement: shouldOpenUpwards ? 'top' : 'bottom',
    });
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  // Update position on scroll/resize anywhere in the window
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, align]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const sizeClasses = {
    sm: 'h-7 px-2 text-[11px] gap-1.5',
    md: 'h-8 px-2.5 text-xs gap-2',
  }[size];

  const handleSelect = (option: SelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-[#141417] font-medium text-neutral-900 dark:text-neutral-100 transition-all duration-150 hover:bg-white dark:hover:bg-[#1a1a1f] hover:border-neutral-400 dark:hover:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          {icon && <span className="shrink-0 text-neutral-500 dark:text-neutral-400">{icon}</span>}
          {prefix && <span className="shrink-0 text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">{prefix}</span>}
          <span className="truncate">
            {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
          }`}
        />
      </button>

      {/* Portal Dropdown Menu: rendered at document.body with auto-flip & viewport safety */}
      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            tabIndex={-1}
            className={`fixed z-[9999] overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111114] p-1 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
            style={{
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: coords.left !== undefined ? `${coords.left}px` : undefined,
              right: coords.right !== undefined ? `${coords.right}px` : undefined,
              width: `${coords.width}px`,
              maxWidth: '320px',
              maxHeight: `${coords.maxHeight}px`,
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden truncate">
                    {option.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected
                            ? 'text-white dark:text-neutral-900'
                            : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                        }`}
                      >
                        {option.icon}
                      </span>
                    )}
                    <div className="flex flex-col truncate">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span
                          className={`text-[10px] ${
                            isSelected
                              ? 'text-white/80 dark:text-neutral-600'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

export default CustomSelect;
