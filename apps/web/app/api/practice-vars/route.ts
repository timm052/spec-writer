import { NextResponse } from 'next/server';
import { practiceVars } from '../../../lib/practice-vars';

export function GET() {
  return NextResponse.json(practiceVars);
}
