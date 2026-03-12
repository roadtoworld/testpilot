import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(dbDir, 'testpilot.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';
export type TestType = 'plain-english' | 'code';

export interface Test {
  id: string;
  name: string;
  url: string;
  description: string;
  steps: string; // JSON string of steps
  type: TestType;
  schedule: string | null;
  schedule_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: string;
  test_id: string;
  status: TestStatus;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  screenshot_path: string | null;
  video_path: string | null;
  logs: string | null;
  error: string | null;
  steps_result: string | null; // JSON
  created_at: string;
}
