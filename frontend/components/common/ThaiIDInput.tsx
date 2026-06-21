'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { thaiIdChecksum } from '@/lib/utils';

interface ThaiIDInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export const ThaiIDInput: React.FC<ThaiIDInputProps> = ({
  value = '',
  onChange,
  onValidChange,
  disabled,
  error,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 13);
    onChange(input);
  };

  const handleBlur = () => {
    if (value.length === 13) {
      const isValid = thaiIdChecksum(value);
      onValidChange?.(isValid);
    }
  };

  const isValid = value.length === 13 && thaiIdChecksum(value);
  const displayError = error || (value.length === 13 && !isValid ? 'รหัสประจำตัวประชาชนไม่ถูกต้อง' : '');

  return (
    <div>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="XXXXXXXXXXXXX"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        maxLength={13}
        className={displayError ? 'border-red-500' : isValid ? 'border-green-500' : ''}
      />
      {displayError && <p className="text-sm text-red-500 mt-1">{displayError}</p>}
    </div>
  );
};
