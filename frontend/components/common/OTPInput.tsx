'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, disabled }) => {
  const [otp, setOtp] = useState<string[]>(value.split('').slice(0, 6));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setOtp(value.split('').slice(0, 6));
  }, [value]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    if (digit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    onChange(newOtp.join(''));

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        handleChange(index, '');
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedDigits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (pastedDigits.length > 0) {
      const newOtp = pastedDigits.split('').slice(0, 6);
      setOtp(newOtp);
      onChange(newOtp.join(''));
      inputRefs.current[Math.min(pastedDigits.length, 5)]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-bold text-center"
        />
      ))}
    </div>
  );
};
