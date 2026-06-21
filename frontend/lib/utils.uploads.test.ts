import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveUploadUrl } from './utils';

describe('resolveUploadUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('resolves a relative /uploads/ path against the backend origin, not /api', () => {
    // Regression test for the production bug: a death certificate link
    // like "/uploads/{id}/cert.pdf" was rendered as <a href="..."> directly,
    // which the browser resolved against the frontend's own origin
    // (localhost:3000) and 404'd. The backend serves /uploads at its root,
    // not under /api, so naively appending the path to API_BASE_URL would
    // also be wrong (would produce .../api/uploads/...).
    const result = resolveUploadUrl('/uploads/abc-123/death-cert-xyz.pdf');
    expect(result).toBe('http://localhost:8080/uploads/abc-123/death-cert-xyz.pdf');
  });

  it('does not include /api in the resolved URL', () => {
    const result = resolveUploadUrl('/uploads/abc/file.pdf');
    expect(result).not.toContain('/api/uploads');
  });

  it('adds a leading slash if the path is missing one', () => {
    const result = resolveUploadUrl('uploads/abc/file.pdf');
    expect(result).toBe('http://localhost:8080/uploads/abc/file.pdf');
  });

  it('passes through an already-absolute URL unchanged (e.g. future R2/S3 storage)', () => {
    const url = 'https://r2.example.com/bucket/file.pdf';
    expect(resolveUploadUrl(url)).toBe(url);
  });

  it('returns an empty string for null', () => {
    expect(resolveUploadUrl(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(resolveUploadUrl(undefined)).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(resolveUploadUrl('')).toBe('');
  });

  it('falls back to localhost:8080 when NEXT_PUBLIC_API_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const result = resolveUploadUrl('/uploads/abc/file.pdf');
    expect(result).toBe('http://localhost:8080/uploads/abc/file.pdf');
  });
});