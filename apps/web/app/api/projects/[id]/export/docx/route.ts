import { NextResponse } from 'next/server';
import { buildSpecDocx } from '@spec-writer/export';
import { buildSpecSections } from '../../../../../../lib/build-spec-sections';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const spec = await buildSpecSections(id);
    if (!spec) {
      return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const buffer = await buildSpecDocx(spec.project, spec.sections);
    const filename = [spec.project.number, spec.project.name, 'Specification']
      .filter(Boolean)
      .join(' - ')
      .replace(/[^a-z0-9 \-]/gi, '')
      .trim();

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}.docx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'DOCX export failed', code: 'EXPORT_ERROR' }, { status: 500 });
  }
}
