import { describe, it, expect } from 'vitest';
import { stripHtml } from '../../lib/strip-html.js';

describe('stripHtml', () => {
  it('returns plain text unchanged', () => {
    expect(stripHtml('Hello world')).toBe('Hello world');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('strips paragraph tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello');
  });

  it('strips opening and closing tags', () => {
    expect(stripHtml('<strong>Bold text</strong>')).toBe('Bold text');
  });

  it('converts <br> to a space', () => {
    const result = stripHtml('Line 1<br>Line 2');
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });

  it('converts self-closing <br/> to a space', () => {
    const result = stripHtml('A<br/>B');
    expect(result).toBe('A B');
  });

  it('adds space at </p> boundary', () => {
    const result = stripHtml('<p>First</p><p>Second</p>');
    expect(result).toContain('First');
    expect(result).toContain('Second');
  });

  it('adds space at </li> boundary', () => {
    const result = stripHtml('<ul><li>Item A</li><li>Item B</li></ul>');
    expect(result).toContain('Item A');
    expect(result).toContain('Item B');
  });

  it('decodes &amp;', () => {
    expect(stripHtml('A &amp; B')).toBe('A & B');
  });

  it('decodes &lt; and &gt;', () => {
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
  });

  it('decodes &quot;', () => {
    expect(stripHtml('&quot;quoted&quot;')).toBe('"quoted"');
  });

  it('decodes &#39; apostrophe', () => {
    expect(stripHtml('it&#39;s')).toBe("it's");
  });

  it('decodes &nbsp; to a regular space', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });

  it('collapses multiple spaces into one', () => {
    expect(stripHtml('<p>  too   many   spaces  </p>')).toBe('too many spaces');
  });

  it('trims leading and trailing whitespace', () => {
    expect(stripHtml('  <p>text</p>  ')).toBe('text');
  });

  it('handles deeply nested tags', () => {
    expect(stripHtml('<div><p><strong>deep</strong></p></div>')).toBe('deep');
  });

  it('handles tags with attributes', () => {
    expect(stripHtml('<p class="foo" id="bar">content</p>')).toBe('content');
  });

  it('handles combined HTML and entities', () => {
    const result = stripHtml('<p>Tom &amp; Jerry</p><p>Film &quot;Classic&quot;</p>');
    expect(result).toContain('Tom & Jerry');
    expect(result).toContain('Film "Classic"');
  });
});
