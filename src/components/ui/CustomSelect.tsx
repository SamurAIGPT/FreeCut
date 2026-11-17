import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
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
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border border-app-border bg-app-elevated font-medium text-app-text transition-all duration-150 hover:bg-app-surface hover:border-neutral-400 dark:hover:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 overflow-hidden truncate">
          {icon && <span className="shrink-0 text-app-text-muted">{icon}</span>}
          {prefix && <span className="shrink-0 text-[10px] text-app-text-muted font-normal">{prefix}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-app-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-app-text' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1.5 min-w-[140px] max-h-60 overflow-y-auto rounded-xl border border-app-border bg-app-surface p-1 shadow-2xl backdrop-blur-md transition-all ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
          style={{ minWidth: 'max(100%, 140px)' }}
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
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-semibold shadow-sm'
                    : 'text-app-text hover:bg-app-elevated'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  {option.icon && (
                    <span
                      className={`shrink-0 ${
                        isSelected
                          ? 'text-white dark:text-neutral-900'
                          : 'text-app-text-muted group-hover:text-app-text'
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
                            ? 'text-white/80 dark:text-neutral-700'
                            : 'text-app-text-muted'
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
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
