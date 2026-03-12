import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const total_tests = (db.prepare('SELECT COUNT(*) as c FROM tests').get() as any).c;
  const total_runs = (db.prepare('SELECT COUNT(*) as c FROM runs').get() as any).c;
  const passed_runs = (db.prepare("SELECT COUNT(*) as c FROM runs WHERE status='passed'").get() as any).c;
  const failed_runs = (db.prepare("SELECT COUNT(*) as c FROM runs WHERE status='failed' OR status='error'").get() as any).c;
  const scheduled_tests = (db.prepare('SELECT COUNT(*) as c FROM tests WHERE schedule_enabled=1').get() as any).c;

  return NextResponse.json({ total_tests, total_runs, passed_runs, failed_runs, scheduled_tests });
}
