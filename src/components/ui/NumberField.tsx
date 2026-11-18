import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export interface NumberFieldProps {
  value: number;
  defaultValue?: number;
  isDefault?: boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  icon?: React.ReactNode;
  dragSensitivity?: 'default' | 'slow' | number;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
  onScrub?: (value: number) => void;
  onScrubEnd?: () => void;
  onReset?: () => void;
  ariaLabel?: string;
}

function tryEvaluateExpression(expr: string): number | null {
  const sanitized = expr.trim();
  if (!sanitized) return null;
  const direct = parseFloat(sanitized);
  if (!isNaN(direct) && /^-?\d*(\.\d*)?$/.test(sanitized)) {
    return direct;
  }
  if (/^[0-9\s.+\-*/()]+$/.test(sanitized)) {
    try {
      const fn = new Function(`"use strict"; return (${sanitized})`);
      const res = fn();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return res;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  value,
  defaultValue,
  isDefault: isDefaultProp,
  min,
  max,
  step = 1,
  suffix,
  icon,
  dragSensitivity = 'default',
  disabled = false,
  className = '',
  onChange,
  onScrub,
  onScrubEnd,
  onReset,
  ariaLabel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(value));
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startValRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft value when not actively typing/focused
  useEffect(() => {
    if (!isEditing) {
      setDraftValue(Number.isInteger(value) ? String(value) : value.toFixed(step < 0.1 ? 2 : 1));
    }
  }, [value, isEditing, step]);

  const sensitivityMultiplier =
    typeof dragSensitivity === 'number'
      ? dragSensitivity
      : dragSensitivity === 'slow'
      ? 0.5
      : 1.0;

  const clampValue = (val: number): number => {
    let clamped = val;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  const snapValue = (val: number): number => {
    const precision = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
    const factor = Math.pow(10, precision);
    const snapped = Math.round(val / step) * step;
    return Math.round(snapped * factor) / factor;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || e.button !== 0 || isEditing) return;

    // Check if target was the reset button or an active text selection
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startValRef.current = value;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const change = deltaX * sensitivityMultiplier * step;
      const nextVal = clampValue(snapValue(startValRef.current + change));

      if (onScrub) {
        onScrub(nextVal);
      } else {
        onChange(nextVal);
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        onScrubEnd?.();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const commitDraft = () => {
    setIsEditing(false);
    const evaluated = tryEvaluateExpression(draftValue);
    if (evaluated !== null) {
      const finalVal = clampValue(snapValue(evaluated));
      onChange(finalVal);
      setDraftValue(Number.isInteger(finalVal) ? String(finalVal) : finalVal.toFixed(step < 0.1 ? 2 : 1));
      onScrubEnd?.();
    } else {
      setDraftValue(Number.isInteger(value) ? String(value) : value.toFixed(step < 0.1 ? 2 : 1));
    }
  };

  const isDefault =
    isDefaultProp !== undefined
      ? isDefaultProp
      : defaultValue !== undefined
      ? Math.abs(value - defaultValue) < 0.0001
      : true;

  return (
    <div
      onPointerDown={handlePointerDown}
      className={`group relative flex h-8 w-full min-w-0 items-center rounded-md border border-neutral-200 dark:border-neutral-700/60 bg-neutral-100/80 dark:bg-neutral-800/60 px-2 text-xs transition select-none cursor-ew-resize focus-within:border-blue-500 focus-within:bg-app-surface focus-within:ring-1 focus-within:ring-blue-500/20 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Icon / Leading label indicator */}
      {icon && (
        <span className="shrink-0 mr-1.5 text-neutral-400 dark:text-neutral-500 flex items-center justify-center text-[11px] font-medium pointer-events-none">
          {icon}
        </span>
      )}

      {/* Numerical input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        disabled={disabled}
        value={draftValue}
        onFocus={(e) => {
          setIsEditing(true);
          e.target.select();
        }}
        onChange={(e) => {
          const nextText = e.target.value;
          setDraftValue(nextText);

          // Real-time canvas reflection on every keystroke
          const evaluated = tryEvaluateExpression(nextText);
          if (evaluated !== null) {
            // Apply live change to video canvas
            let liveVal = evaluated;
            if (max !== undefined && liveVal > max) liveVal = max;
            onChange(liveVal);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitDraft();
            inputRef.current?.blur();
          } else if (e.key === 'Escape') {
            setDraftValue(Number.isInteger(value) ? String(value) : value.toFixed(step < 0.1 ? 2 : 1));
            setIsEditing(false);
            inputRef.current?.blur();
          }
        }}
        onBlur={commitDraft}
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-app-text outline-none cursor-text [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      {/* Suffix label */}
      {suffix && !isEditing && (
        <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500 pointer-events-none ml-0.5 mr-1 font-mono">
          {suffix}
        </span>
      )}

      {/* Reset-to-default button: appears only when value !== defaultValue */}
      {onReset && !isDefault && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          title="Reset to default"
          className="shrink-0 ml-1 flex h-4 w-4 items-center justify-center rounded text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition cursor-pointer"
        >
          <RotateCcw className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
};
