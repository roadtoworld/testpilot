import cron from 'node-cron';
import { getDb, Test } from './db';
import { runTest } from './runner';
import { randomUUID } from 'crypto';

const scheduledJobs = new Map<string, cron.ScheduledTask>();

export function startScheduler() {
  const db = getDb();
  const tests = db.prepare('SELECT * FROM tests WHERE schedule IS NOT NULL AND schedule_enabled = 1').all() as Test[];

  for (const test of tests) {
    scheduleTest(test);
  }
  console.log(`[Scheduler] Started ${tests.length} scheduled tests`);
}

export function scheduleTest(test: Test) {
  if (!test.schedule || !test.schedule_enabled) return;

  // Remove existing
  const existing = scheduledJobs.get(test.id);
  if (existing) {
    existing.stop();
    scheduledJobs.delete(test.id);
  }

  if (!cron.validate(test.schedule)) {
    console.error(`[Scheduler] Invalid cron for test ${test.id}: ${test.schedule}`);
    return;
  }

  const task = cron.schedule(test.schedule, async () => {
    console.log(`[Scheduler] Running scheduled test: ${test.name}`);
    const db = getDb();
    const runId = randomUUID();
    const steps = JSON.parse(test.steps);

    db.prepare(`INSERT INTO runs (id, test_id, status, started_at, created_at) VALUES (?, ?, 'running', ?, ?)`)
      .run(runId, test.id, new Date().toISOString(), new Date().toISOString());

    try {
      const result = await runTest(runId, test.url, steps);
      db.prepare(`UPDATE runs SET status=?, finished_at=?, duration_ms=?, screenshot_path=?, video_path=?, logs=?, error=?, steps_result=? WHERE id=?`)
        .run(
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
  });

  scheduledJobs.set(test.id, task);
  console.log(`[Scheduler] Scheduled test "${test.name}" with cron: ${test.schedule}`);
}

export function unscheduleTest(testId: string) {
  const existing = scheduledJobs.get(testId);
  if (existing) {
    existing.stop();
    scheduledJobs.delete(testId);
  }
}

export const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9am', value: '0 9 * * *' },
  { label: 'Weekly (Monday 9am)', value: '0 9 * * 1' },
];
