import { NextResponse } from 'next/server';
import { resetAllOverrides } from '@spec-writer/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await resetAllOverrides(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to reset overrides', code: 'RESET_ERROR' }, { status: 500 });
  }
}
