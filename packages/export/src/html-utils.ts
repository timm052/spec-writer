/**
 * Utilities for converting TipTap HTML output to plain text or structured blocks
 * for use in PDF and DOCX exporters.
 */

export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'listItem' | 'orderedListItem';

export interface Block {
  type: BlockType;
  runs: TextRun[];
}

/**
 * Parse basic TipTap HTML into structured blocks for PDF/DOCX rendering.
 * Handles: <p>, <h1>-<h3>, <ul>/<li>, <ol>/<li>, <strong>, <em>, <br>.
 */
export function htmlToBlocks(html: string): Block[] {
  if (!html || !/<[a-z]/i.test(html)) {
    // Plain text — wrap in a single paragraph
    return [{ type: 'paragraph', runs: [{ text: html }] }];
  }

  const blocks: Block[] = [];

  // Normalise line endings
  const normalised = html.replace(/\r\n?/g, '\n');

  // Extract top-level block tags
  const blockRe =
    /<(p|h1|h2|h3|li)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi;

  // Track ordered vs unordered list context via a simple scan
  // Build an ordered list of { tag, listType?, content } tuples
  type RawBlock = { tag: string; content: string; listType?: 'ul' | 'ol' };
  const rawBlocks: RawBlock[] = [];

  // Walk through the HTML, picking up list items with their parent context
  let cursor = 0;
  const listStack: Array<'ul' | 'ol'> = [];

  const tokenRe = /<(\/?)(?:(ul|ol|li|p|h1|h2|h3))((?:\s[^>]*)?)\s*>/gi;
  let m: RegExpExecArray | null;
  let contentStart = 0;
  let insideBlock: string | null = null;

  // Reset regex
  tokenRe.lastIndex = 0;

  // Simpler approach: sequential scan
  const scanner = /<(\/?)(?:ul|ol|li|p|h1|h2|h3)((?:\s[^>]*)?)>/gi;
  let lastTag = '';
  let depth = 0;

  // Use a straightforward regex approach per block type
  // Replace all block-level HTML with structured output
  const cleaned = normalised
    // Preserve list structure
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner: string) => {
      return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item: string) => `\x00ul\x01${item}\x02`);
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner: string) => {
      return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (__, item: string) => `\x00ol\x01${item}\x02`);
    });

  // Now split on block-level elements
  const blockPattern = /(<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>)|(<p[^>]*>[\s\S]*?<\/p>)|(\x00(ul|ol)\x01[\s\S]*?\x02)/gi;

  let pos = 0;
  let match: RegExpExecArray | null;
  blockPattern.lastIndex = 0;

  while ((match = blockPattern.exec(cleaned)) !== null) {
    const raw = match[0];

    if (raw.startsWith('\x00')) {
      // List item
      const listType = match[4] as 'ul' | 'ol';
      const inner = raw.slice(4, raw.length - 1); // strip markers
      blocks.push({
        type: listType === 'ol' ? 'orderedListItem' : 'listItem',
        runs: parseInline(inner),
      });
    } else if (/^<h1/i.test(raw)) {
      const inner = raw.replace(/<[^>]+>/g, '');
      blocks.push({ type: 'heading1', runs: [{ text: decodeEntities(inner) }] });
    } else if (/^<h2/i.test(raw)) {
      const inner = raw.replace(/<[^>]+>/g, '');
      blocks.push({ type: 'heading2', runs: [{ text: decodeEntities(inner) }] });
    } else if (/^<h3/i.test(raw)) {
      const inner = raw.replace(/<[^>]+>/g, '');
      blocks.push({ type: 'heading3', runs: [{ text: decodeEntities(inner) }] });
    } else {
      // <p>
      const inner = raw.replace(/^<p[^>]*>|<\/p>$/gi, '');
      const runs = parseInline(inner);
      if (runs.some((r) => r.text.trim())) {
        blocks.push({ type: 'paragraph', runs });
      }
    }
  }

  if (blocks.length === 0) {
    // Fallback: strip all tags
    blocks.push({ type: 'paragraph', runs: [{ text: htmlToPlainText(html) }] });
  }

  return blocks;
}

/** Parse inline HTML (bold, italic, text) into TextRun array. */
function parseInline(html: string): TextRun[] {
  const runs: TextRun[] = [];

  // Normalise <br> to space
  const normalised = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '\x00bold\x01$1\x02')
    .replace(/<b>([\s\S]*?)<\/b>/gi, '\x00bold\x01$1\x02')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '\x00italic\x01$1\x02')
    .replace(/<i>([\s\S]*?)<\/i>/gi, '\x00italic\x01$1\x02');

  // Split on markers
  const parts = normalised.split(/(\x00(?:bold|italic)\x01[\s\S]*?\x02)/);

  for (const part of parts) {
    if (part.startsWith('\x00bold\x01')) {
      const text = decodeEntities(stripTags(part.slice(6, -1)));
      if (text) runs.push({ text, bold: true });
    } else if (part.startsWith('\x00italic\x01')) {
      const text = decodeEntities(stripTags(part.slice(8, -1)));
      if (text) runs.push({ text, italic: true });
    } else {
      const text = decodeEntities(stripTags(part));
      if (text) runs.push({ text });
    }
  }

  return runs.length ? runs : [{ text: '' }];
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Convert HTML to plain text (for contexts that don't need structure). */
export function htmlToPlainText(html: string): string {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
