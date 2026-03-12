# 🚀 TestPilot — AI-Powered Web Testing

A personal, self-hosted web testing tool. Auto-generate E2E tests from any URL using AI, run them in a real browser, watch video replays, and schedule automated runs.

## ✨ Features

- **AI Test Generation** — Enter a URL, Claude AI generates 5–8 comprehensive test cases automatically
- **Plain English & Code Steps** — Write tests in plain English ("Click the login button") or raw Playwright code
- **Real Browser Execution** — Tests run in a real Chromium browser via Playwright
- **Video Replay** — Every run records a video you can watch back
- **Screenshots** — Step-by-step and final-state screenshots
- **Scheduled Runs** — Set cron schedules to run tests automatically (hourly, daily, weekly, etc.)
- **Run History** — Full history with logs, step results, pass/fail status
- **Local & Private** — Everything stored in a local SQLite database

---

## 🛠 Setup

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Install dependencies
```bash
npm install
```

### 2. Install Playwright browser
```bash
npx playwright install chromium
```

### 3. Initialize the database
```bash
node scripts/init-db.js
```

Or run all three steps at once:
```bash
npm run setup
```

### 4. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
```

### 5. Start the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📖 Usage

### Creating Tests

**Option A: AI Generate**
1. Click "New Test" → "AI Generate" tab
2. Enter your target URL
3. Click "Generate" — AI will create 5–8 test cases
4. Click a generated test to review/edit it
5. Save it

**Option B: Manual Build**
1. Click "New Test" → "Manual Build" tab
2. Choose "Plain English" or "Code" mode
3. Add steps manually
4. Optionally set a schedule
5. Save

### Running Tests
- Go to any test detail page
- Click **"Run Now"**
- Watch the run appear in real-time (auto-refreshes every 2s)
- Expand a run to see: video replay, screenshots, step-by-step results, logs

### Scheduling
When creating/editing a test, toggle "Schedule" on and pick a preset or enter a custom cron expression.

Schedules start automatically when the Next.js server starts.

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + React |
| Styling | Tailwind CSS |
| Browser Automation | Playwright (Chromium) |
| AI Test Generation | Anthropic Claude (claude-sonnet-4) |
| Database | SQLite via better-sqlite3 |
| Scheduling | node-cron |

---

## 📁 Project Structure

```
testpilot/
├── app/
│   ├── api/
│   │   ├── tests/          # CRUD + AI generation
│   │   └── runs/           # Run trigger + history
│   ├── dashboard/          # Overview page
│   ├── tests/              # Test list + detail + new
│   └── runs/               # All runs history
├── components/
│   └── Sidebar.tsx
├── lib/
│   ├── db.ts               # SQLite connection
│   ├── runner.ts           # Playwright test runner
│   ├── ai.ts               # Anthropic AI integration
│   └── scheduler.ts        # Cron job manager
├── scripts/
│   └── init-db.js          # Database setup
├── data/                   # SQLite DB (auto-created)
└── public/media/           # Screenshots & videos (auto-created)
```

---

## 🔧 Writing Plain English Steps

TestPilot interprets these patterns:

| Pattern | Example |
|---------|---------|
| `Go to <url>` | `Go to https://example.com` |
| `Navigate to <url>` | `Navigate to /login` |
| `Click <target>` | `Click "Submit" button` |
| `Type "<text>" in <selector>` | `Type "user@email.com" in #email` |
| `Assert <text>` | `Assert "Welcome" is visible` |
| `Verify <text>` | `Verify the page contains "Success"` |
| `Wait <N> seconds` | `Wait 2 seconds` |
| `Scroll down` | `Scroll down` |

## 🔧 Writing Code Steps

Use any Playwright `page` API:
```javascript
await page.click('#login-btn');
await page.fill('input[name="email"]', 'test@example.com');
await expect(page.locator('h1')).toBeVisible();
```

---

## 💡 Tips

- Generated screenshots are stored in `public/media/` — they're served directly by Next.js
- The SQLite database is at `data/testpilot.db` — back it up to keep your history
- Scheduled tests start running as soon as you start the Next.js server
- For production use, run with `npm run build && npm start`
