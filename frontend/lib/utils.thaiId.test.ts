import { describe, it, expect } from 'vitest';
import { thaiIdChecksum } from './utils';

describe('thaiIdChecksum', () => {
  it('accepts a valid 13-digit ID with correct check digit', () => {
    expect(thaiIdChecksum('1101700203450')).toBe(true);
  });

  it('accepts another valid ID (different prefix)', () => {
    expect(thaiIdChecksum('3201999123452')).toBe(true);
  });

  it('accepts a valid ID with leading zeros in the prefix', () => {
    expect(thaiIdChecksum('1002000000001')).toBe(true);
  });

  it('rejects an ID with an incorrect check digit', () => {
    // Same prefix as a valid case above, but wrong final digit
    expect(thaiIdChecksum('1101700203451')).toBe(false);
  });

  it('rejects an ID shorter than 13 digits', () => {
    expect(thaiIdChecksum('123456789012')).toBe(false);
  });

  it('rejects an ID longer than 13 digits', () => {
    expect(thaiIdChecksum('12345678901234')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(thaiIdChecksum('')).toBe(false);
  });

  it('rejects a string containing non-digit characters', () => {
    expect(thaiIdChecksum('110170020345X')).toBe(false);
  });

  it('rejects a string with the right length but all same digit', () => {
    expect(thaiIdChecksum('1111111111111')).toBe(false);
  });
});