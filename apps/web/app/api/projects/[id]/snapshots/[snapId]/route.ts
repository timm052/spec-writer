import { NextResponse } from 'next/server';
import { getSnapshotById } from '@spec-writer/db';

interface RouteContext {
  params: Promise<{ id: string; snapId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { snapId } = await params;
    const snapshot = await getSnapshotById(snapId);
    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json(snapshot);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch snapshot', code: 'FETCH_ERROR' }, { status: 500 });
  }
}
