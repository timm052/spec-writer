import { describe, it, expect } from 'vitest';
import { buildSpecHtml, buildSpecPdf, buildSpecDocx, buildSpecJson } from '../src/index.js';

describe('Export package index exports', () => {
  it('exports buildSpecHtml as a function', () => {
    expect(typeof buildSpecHtml).toBe('function');
  });

  it('exports buildSpecPdf as a function', () => {
    expect(typeof buildSpecPdf).toBe('function');
  });

  it('exports buildSpecDocx as a function', () => {
    expect(typeof buildSpecDocx).toBe('function');
  });

  it('exports buildSpecJson as a function', () => {
    expect(typeof buildSpecJson).toBe('function');
  });
});
