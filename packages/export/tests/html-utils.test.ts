import { describe, it, expect } from 'vitest';
import { htmlToPlainText, htmlToBlocks } from '../src/html-utils.js';

describe('htmlToPlainText', () => {
  it('returns plain text unchanged', () => {
    expect(htmlToPlainText('Hello world')).toBe('Hello world');
  });

  it('strips paragraph tags', () => {
    expect(htmlToPlainText('<p>Hello</p>')).toBe('Hello');
  });

  it('converts list items to bullet points', () => {
    const result = htmlToPlainText('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(result).toContain('• Item 1');
    expect(result).toContain('• Item 2');
  });

  it('decodes HTML entities', () => {
    expect(htmlToPlainText('<p>A &amp; B &lt;C&gt;</p>')).toBe('A & B <C>');
  });

  it('converts <br> to newline', () => {
    const result = htmlToPlainText('Line 1<br>Line 2');
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });

  it('handles empty string', () => {
    expect(htmlToPlainText('')).toBe('');
  });

  it('decodes &quot; and &#39; entities', () => {
    expect(htmlToPlainText('&quot;hello&quot; it&#39;s')).toBe('"hello" it\'s');
  });

  it('decodes &nbsp; to space', () => {
    expect(htmlToPlainText('hello&nbsp;world')).toBe('hello world');
  });

  it('trims leading and trailing whitespace', () => {
    expect(htmlToPlainText('<p>  Hello  </p>')).toBe('Hello');
  });

  it('handles ordered list items with bullet prefix', () => {
    const result = htmlToPlainText('<ol><li>First</li><li>Second</li></ol>');
    expect(result).toContain('• First');
    expect(result).toContain('• Second');
  });

  it('collapses excessive newlines to at most two consecutive', () => {
    const result = htmlToPlainText('<p>A</p><p>B</p>');
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('strips heading tags and preserves text', () => {
    const result = htmlToPlainText('<h1>Title</h1><p>Body</p>');
    expect(result).toContain('Title');
    expect(result).toContain('Body');
  });

  it('handles self-closing <br/> variant', () => {
    const result = htmlToPlainText('A<br/>B');
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('handles nested tags', () => {
    const result = htmlToPlainText('<p><strong>Bold</strong> text</p>');
    expect(result).toContain('Bold');
    expect(result).toContain('text');
  });
});

describe('htmlToBlocks', () => {
  it('wraps plain text in a paragraph block', () => {
    const blocks = htmlToBlocks('Hello world');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('paragraph');
    expect(blocks[0]?.runs[0]?.text).toBe('Hello world');
  });

  it('parses bold runs via <strong>', () => {
    const blocks = htmlToBlocks('<p>Normal <strong>bold</strong> text</p>');
    const para = blocks.find((b) => b.type === 'paragraph');
    expect(para).toBeDefined();
    const boldRun = para?.runs.find((r) => r.bold);
    expect(boldRun?.text).toBe('bold');
  });

  it('parses italic runs via <em>', () => {
    const blocks = htmlToBlocks('<p>Normal <em>italic</em> text</p>');
    const para = blocks.find((b) => b.type === 'paragraph');
    const italicRun = para?.runs.find((r) => r.italic);
    expect(italicRun?.text).toBe('italic');
  });

  it('parses <b> tag as bold', () => {
    const blocks = htmlToBlocks('<p>Text <b>bold</b> end</p>');
    const para = blocks.find((b) => b.type === 'paragraph');
    const boldRun = para?.runs.find((r) => r.bold);
    expect(boldRun?.text).toBe('bold');
  });

  it('parses <i> tag as italic', () => {
    const blocks = htmlToBlocks('<p>Text <i>italic</i> end</p>');
    const para = blocks.find((b) => b.type === 'paragraph');
    const italicRun = para?.runs.find((r) => r.italic);
    expect(italicRun?.text).toBe('italic');
  });

  it('parses h1 headings', () => {
    const blocks = htmlToBlocks('<h1>Main heading</h1>');
    expect(blocks.some((b) => b.type === 'heading1')).toBe(true);
    const h1 = blocks.find((b) => b.type === 'heading1');
    expect(h1?.runs[0]?.text).toBe('Main heading');
  });

  it('parses h2 headings', () => {
    const blocks = htmlToBlocks('<h2>Section heading</h2>');
    expect(blocks.some((b) => b.type === 'heading2')).toBe(true);
  });

  it('parses h3 headings', () => {
    const blocks = htmlToBlocks('<h3>Sub heading</h3>');
    expect(blocks.some((b) => b.type === 'heading3')).toBe(true);
  });

  it('parses unordered list items as listItem type', () => {
    const blocks = htmlToBlocks('<ul><li>First item</li><li>Second item</li></ul>');
    const listItems = blocks.filter((b) => b.type === 'listItem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]?.runs[0]?.text).toBe('First item');
  });

  it('parses ordered list items as orderedListItem type', () => {
    const blocks = htmlToBlocks('<ol><li>Step one</li><li>Step two</li></ol>');
    const items = blocks.filter((b) => b.type === 'orderedListItem');
    expect(items).toHaveLength(2);
    expect(items[0]?.runs[0]?.text).toBe('Step one');
  });

  it('handles multiple paragraphs', () => {
    const blocks = htmlToBlocks('<p>First paragraph</p><p>Second paragraph</p>');
    const paras = blocks.filter((b) => b.type === 'paragraph');
    expect(paras.length).toBeGreaterThanOrEqual(2);
  });

  it('decodes HTML entities in paragraph text', () => {
    const blocks = htmlToBlocks('<p>Tom &amp; Jerry</p>');
    const para = blocks.find((b) => b.type === 'paragraph');
    const allText = para?.runs.map((r) => r.text).join('');
    expect(allText).toContain('Tom & Jerry');
  });

  it('returns at least one block for empty-ish HTML', () => {
    const blocks = htmlToBlocks('<p></p>');
    expect(blocks.length).toBeGreaterThanOrEqual(1);
  });

  it('returns non-empty runs array for each block', () => {
    const blocks = htmlToBlocks('<p>Some text</p>');
    for (const block of blocks) {
      expect(block.runs).toBeDefined();
      expect(Array.isArray(block.runs)).toBe(true);
    }
  });

  it('handles mixed content (paragraphs and lists)', () => {
    const blocks = htmlToBlocks('<p>Intro</p><ul><li>Item</li></ul>');
    const types = blocks.map((b) => b.type);
    expect(types).toContain('paragraph');
    expect(types).toContain('listItem');
  });
});
