import { NextResponse } from 'next/server';
import { getProjectIssues, createProjectIssue } from '@spec-writer/db';
import { CreateProjectIssueSchema } from '@spec-writer/core';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const issues = await getProjectIssues(id);
    return NextResponse.json(issues);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch issues', code: 'FETCH_ERROR' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = CreateProjectIssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }
    const issue = await createProjectIssue(id, {
      revision: parsed.data.revision,
      description: parsed.data.description,
      issuedAt: parsed.data.issuedAt ? new Date(parsed.data.issuedAt) : undefined,
    });
    return NextResponse.json(issue, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create issue', code: 'CREATE_ERROR' }, { status: 500 });
  }
}
