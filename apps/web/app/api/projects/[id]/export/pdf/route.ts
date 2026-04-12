import { NextResponse } from 'next/server';
import { buildSpecPdf } from '@spec-writer/export';
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

    const buffer = await buildSpecPdf(spec.project, spec.sections);
    const filename = [spec.project.number, spec.project.name, 'Specification']
      .filter(Boolean)
      .join(' - ')
      .replace(/[^a-z0-9 \-]/gi, '')
      .trim();

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[PDF export]', err);
    return NextResponse.json({ error: 'PDF export failed', code: 'EXPORT_ERROR' }, { status: 500 });
  }
}
