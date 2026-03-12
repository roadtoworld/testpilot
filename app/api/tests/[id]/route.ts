import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(params.id);
  if (!test) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ test });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const { unscheduleTest } = await import('@/lib/scheduler');
  unscheduleTest(params.id);
  db.prepare('DELETE FROM tests WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
