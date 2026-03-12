import { NextRequest, NextResponse } from 'next/server';
import { getDb, Test } from '@/lib/db';
import { randomUUID } from 'crypto';
import { runTest } from '@/lib/runner';

export async function GET(req: NextRequest) {
  const db = getDb();
  const testId = req.nextUrl.searchParams.get('test_id');

  let runs;
  if (testId) {
    runs = db.prepare(`
      SELECT r.*, t.name as test_name FROM runs r
      JOIN tests t ON t.id = r.test_id
      WHERE r.test_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all(testId);
  } else {
    runs = db.prepare(`
      SELECT r.*, t.name as test_name FROM runs r
      JOIN tests t ON t.id = r.test_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `).all();
  }

  return NextResponse.json({ runs });
}

export async function POST(req: NextRequest) {
  const { test_id } = await req.json();
  const db = getDb();

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(test_id) as Test;
  if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

  const runId = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`INSERT INTO runs (id, test_id, status, started_at, created_at) VALUES (?, ?, 'running', ?, ?)`)
    .run(runId, test_id, now, now);

  // Run async (fire and forget, update DB when done)
  (async () => {
    const steps = JSON.parse(test.steps);
    try {
      const result = await runTest(runId, test.url, steps);
      db.prepare(`
        UPDATE runs SET 
          status=?, finished_at=?, duration_ms=?,
          screenshot_path=?, video_path=?, logs=?, error=?, steps_result=?
        WHERE id=?
      `).run(
        result.status,
        new Date().toISOString(),
        result.duration_ms,
        result.screenshot_path,
        result.video_path,
        JSON.stringify(result.logs),
        result.error,
        JSON.stringify(result.steps_result),
        runId
      );
    } catch (err: any) {
      db.prepare(`UPDATE runs SET status='error', finished_at=?, error=? WHERE id=?`)
        .run(new Date().toISOString(), err.message, runId);
    }
  })();

  return NextResponse.json({ run_id: runId });
}
