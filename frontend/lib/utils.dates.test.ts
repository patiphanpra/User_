import { describe, it, expect } from 'vitest';
import { daysInMonthBE, toIsoDateBE, BE_OFFSET } from './utils';

describe('BE_OFFSET', () => {
  it('is 543 (Buddhist Era is 543 years ahead of Gregorian)', () => {
    expect(BE_OFFSET).toBe(543);
  });
});

describe('toIsoDateBE', () => {
  it('converts 12 กุมภาพันธ์ 2569 (BE) to 2026-02-12 (AD)', () => {
    // This is the exact case from the production date-picker bug report:
    // the old <input type="date"> let "12" land in the wrong slot
    // depending on browser locale. The dropdown-based picker calls this
    // function directly with explicit day/month/year, removing the
    // ambiguity entirely.
    expect(toIsoDateBE('12', '2', '2569')).toBe('2026-02-12');
  });

  it('zero-pads single-digit day and month', () => {
    expect(toIsoDateBE('5', '3', '2568')).toBe('2025-03-05');
  });

  it('handles December correctly (year boundary)', () => {
    expect(toIsoDateBE('31', '12', '2568')).toBe('2025-12-31');
  });

  it('returns null when day is missing', () => {
    expect(toIsoDateBE('', '2', '2569')).toBeNull();
  });

  it('returns null when month is missing', () => {
    expect(toIsoDateBE('12', '', '2569')).toBeNull();
  });

  it('returns null when year is missing', () => {
    expect(toIsoDateBE('12', '2', '')).toBeNull();
  });

  it('returns null for a day that does not exist in the month (Feb 30)', () => {
    expect(toIsoDateBE('30', '2', '2569')).toBeNull();
  });

  it('returns null for day 31 in a 30-day month', () => {
    expect(toIsoDateBE('31', '4', '2569')).toBeNull(); // April has 30 days
  });

  it('accepts Feb 29 in a leap year (2567 BE = 2024 AD)', () => {
    expect(toIsoDateBE('29', '2', '2567')).toBe('2024-02-29');
  });

  it('rejects Feb 29 in a non-leap year (2569 BE = 2026 AD)', () => {
    expect(toIsoDateBE('29', '2', '2569')).toBeNull();
  });
});

describe('daysInMonthBE', () => {
  it('returns 29 for February in a leap year (2567 BE = 2024 AD)', () => {
    expect(daysInMonthBE('2', '2567')).toBe(29);
  });

  it('returns 28 for February in a non-leap year (2569 BE = 2026 AD)', () => {
    expect(daysInMonthBE('2', '2569')).toBe(28);
  });

  it('returns 31 for January', () => {
    expect(daysInMonthBE('1', '2569')).toBe(31);
  });

  it('returns 30 for April', () => {
    expect(daysInMonthBE('4', '2569')).toBe(30);
  });

  it('defaults to 31 when month or year is not yet selected', () => {
    expect(daysInMonthBE('', '2569')).toBe(31);
    expect(daysInMonthBE('2', '')).toBe(31);
  });
});