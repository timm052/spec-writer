import { NextResponse } from 'next/server';
import { deleteProjectIssue } from '@spec-writer/db';

interface RouteContext {
  params: Promise<{ id: string; iid: string }>;
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { iid } = await params;
    await deleteProjectIssue(iid);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete issue', code: 'DELETE_ERROR' }, { status: 500 });
  }
}
