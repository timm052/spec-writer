import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils.js';

describe('cn (class name utility)', () => {
  it('returns a string', () => {
    expect(typeof cn('foo')).toBe('string');
  });

  it('combines multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles a single class', () => {
    expect(cn('only')).toBe('only');
  });

  it('ignores undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('ignores null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('ignores false values', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('supports conditional class objects', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('supports conditional class with truthy/falsy', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
  });

  it('merges conflicting Tailwind classes (last wins)', () => {
    // twMerge should resolve px-4 px-2 → px-2
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('merges conflicting padding classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('keeps non-conflicting classes', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  it('handles empty string input', () => {
    expect(cn('')).toBe('');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });

  it('handles array input', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('handles mixed conditional and static classes', () => {
    const result = cn('base', { extra: true }, 'end');
    expect(result).toContain('base');
    expect(result).toContain('extra');
    expect(result).toContain('end');
  });
});
