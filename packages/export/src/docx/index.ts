import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  PageNumber,
  Footer,
  Header,
  type IParagraphOptions,
} from 'docx';
import type { ExportProject, ExportSection } from '../index.js';
import { htmlToBlocks } from '../html-utils.js';

function clauseBodyParagraphs(html: string): Paragraph[] {
  const blocks = htmlToBlocks(html);
  const paragraphs: Paragraph[] = [];

  for (const block of blocks) {
    const runs = block.runs.map(
      (r) =>
        new TextRun({
          text: r.text,
          bold: r.bold,
          italics: r.italic,
          font: 'Arial',
          size: 20, // half-points → 10pt
        }),
    );

    if (block.type === 'listItem' || block.type === 'orderedListItem') {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: '• ', font: 'Arial', size: 20 }), ...runs],
          indent: { left: 720 },
          spacing: { after: 40 },
        }),
      );
    } else if (block.type === 'heading1') {
      paragraphs.push(
        new Paragraph({
          children: runs,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 120, after: 60 },
        }),
      );
    } else if (block.type === 'heading2' || block.type === 'heading3') {
      paragraphs.push(
        new Paragraph({
          children: runs,
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 80, after: 40 },
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: runs,
          indent: { left: 720 },
          spacing: { after: 60 },
        }),
      );
    }
  }

  return paragraphs;
}

export async function buildSpecDocx(project: ExportProject, sections: ExportSection[]): Promise<Buffer> {
  const date = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const meta = [project.number, project.client, project.address].filter(Boolean).join(' · ');

  const children: Paragraph[] = [
    // Title
    new Paragraph({
      children: [
        new TextRun({
          text: project.name,
          bold: true,
          font: 'Arial',
          size: 36, // 18pt
          color: '1a1a1a',
        }),
      ],
      spacing: { after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 12, color: '1a1a1a' },
      },
    }),
    // Meta
    ...(meta
      ? [
          new Paragraph({
            children: [new TextRun({ text: meta, font: 'Arial', size: 16, color: '555555' })],
            spacing: { after: 40 },
          }),
        ]
      : []),
    // Date
    new Paragraph({
      children: [
        new TextRun({
          text: `Specification prepared ${date}`,
          font: 'Arial',
          size: 16,
          color: '777777',
        }),
      ],
      spacing: { after: 360 },
    }),
  ];

  for (const section of sections) {
    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${section.code} — ${section.title}`.toUpperCase(),
            bold: true,
            font: 'Arial',
            size: 22,
            color: '1a1a1a',
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'cccccc' },
        },
      }),
    );

    for (const clause of section.clauses) {
      // Clause header row: code + title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${clause.code}  `,
              font: 'Courier New',
              size: 16,
              color: '555555',
            }),
            new TextRun({
              text: clause.title,
              bold: true,
              font: 'Arial',
              size: 19,
            }),
          ],
          spacing: { before: 160, after: 60 },
        }),
      );

      // Clause body
      children.push(...clauseBodyParagraphs(clause.resolvedBody));
    }
  }

  const doc = new Document({
    creator: 'Spec Writer',
    title: `${project.name} — Specification`,
    description: meta,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 20mm in twentieths of a point
              bottom: 1417, // 25mm
              left: 1134,
              right: 1134,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: project.name, font: 'Arial', size: 16, color: '999999' }),
                  project.number
                    ? new TextRun({ text: ` · ${project.number}`, font: 'Arial', size: 16, color: '999999' })
                    : new TextRun(''),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Generated by Spec Writer · ', font: 'Arial', size: 14, color: '999999' }),
                  new TextRun({ text: date, font: 'Arial', size: 14, color: '999999' }),
                  new TextRun({ text: '  |  Page ', font: 'Arial', size: 14, color: '999999' }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 14,
                    color: '999999',
                  }),
                  new TextRun({ text: ' of ', font: 'Arial', size: 14, color: '999999' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 14,
                    color: '999999',
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc) as Promise<Buffer>;
}
