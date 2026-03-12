const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(path.join(dbDir, 'testpilot.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    steps TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'plain-english',
    schedule TEXT,
    schedule_enabled INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    test_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TEXT,
    finished_at TEXT,
    duration_ms INTEGER,
    screenshot_path TEXT,
    video_path TEXT,
    logs TEXT,
    error TEXT,
    steps_result TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_runs_test_id ON runs(test_id);
  CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at);
`);

console.log('✅ Database initialized at data/testpilot.db');
db.close();
