import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSnapshot, getSnapshots } from '@spec-writer/db';
import { buildSpecSections } from '../../../../../lib/build-spec-sections';
import { buildSpecJson } from '@spec-writer/export';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PostSchema = z.object({
  label: z.string().optional(),
});

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const snapshots = await getSnapshots(id);
    return NextResponse.json(snapshots);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch snapshots', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const body = await req.json() as unknown;
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const spec = await buildSpecSections(id);
    if (!spec) {
      return NextResponse.json({ error: 'Project not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const snapshotJson = buildSpecJson(spec.project, spec.sections);
    const snapshot = await createSnapshot(id, snapshotJson as Record<string, unknown>, parsed.data.label);

    return NextResponse.json(snapshot, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create snapshot', code: 'SNAPSHOT_ERROR' }, { status: 500 });
  }
}
