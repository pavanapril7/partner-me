'use client';

import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

/**
 * OTP Input Component
 * Requirement: 3.1, 4.1 - 6-digit OTP code input
 * 
 * Features:
 * - Individual input boxes for each digit
 * - Auto-focus on next input after entering a digit
 * - Backspace navigation
 * - Paste support for full OTP code
 * - Error state styling
 */
export function OTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false,
  error = false 
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Ensure value is always the correct length
  // Pad with space to create empty slots for remaining digits
  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  const handleChange = (index: number, digit: string) => {
    // Only allow numeric input
    if (digit && !/^\d$/.test(digit)) {
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').replace(/\s/g, '');
    onChange(newValue);

    // Auto-focus next input if digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // If current input is empty, move to previous input
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        handleChange(index, '');
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Only accept numeric paste data
    if (/^\d+$/.test(pastedData)) {
      const pastedDigits = pastedData.slice(0, length);
      onChange(pastedDigits);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={cn(
            'w-12 h-12 text-center text-lg font-semibold',
            error && 'border-destructive focus-visible:ring-destructive',
            focusedIndex === index && 'ring-2 ring-ring'
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
