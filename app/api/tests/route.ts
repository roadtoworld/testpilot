import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  const db = getDb();
  const tests = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM runs r WHERE r.test_id = t.id) as run_count,
      json_object('status', r.status, 'created_at', r.created_at) as last_run
    FROM tests t
    LEFT JOIN runs r ON r.id = (
      SELECT id FROM runs WHERE test_id = t.id ORDER BY created_at DESC LIMIT 1
    )
    ORDER BY t.created_at DESC
  `).all();

  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, url, description, steps, type, schedule, schedule_enabled } = body;

  if (!name || !url || !steps) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tests (id, name, url, description, steps, type, schedule, schedule_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, url, description || '',
    JSON.stringify(steps), type || 'plain-english',
    schedule || null, schedule_enabled ? 1 : 0,
    now, now
  );

  // If scheduled, register cron
  if (schedule && schedule_enabled) {
    const { scheduleTest } = await import('@/lib/scheduler');
    const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(id) as any;
    scheduleTest(test);
  }

  return NextResponse.json({ id });
}
