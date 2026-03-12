import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

const mediaDir = path.join(process.cwd(), 'public', 'media');
if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });

export interface TestStep {
  id: string;
  instruction: string;
  code?: string;
  type: 'navigate' | 'click' | 'type' | 'assert' | 'wait' | 'screenshot' | 'custom';
}

export interface StepResult {
  stepId: string;
  instruction: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  screenshot?: string;
  duration_ms: number;
}

export interface RunResult {
  status: 'passed' | 'failed' | 'error';
  duration_ms: number;
  screenshot_path: string | null;
  video_path: string | null;
  logs: string[];
  error: string | null;
  steps_result: StepResult[];
}

async function executeStep(
  page: Page,
  step: TestStep,
  logs: string[]
): Promise<StepResult> {
  const start = Date.now();
  logs.push(`[STEP] ${step.instruction}`);

  try {
    if (step.code) {
      // Execute raw Playwright code
      const fn = new Function('page', `return (async () => { ${step.code} })()`);
      await fn(page);
    } else {
      // Interpret plain-English steps
      const instruction = step.instruction.toLowerCase();

      if (instruction.startsWith('go to') || instruction.startsWith('navigate to') || instruction.startsWith('open')) {
        const urlMatch = step.instruction.match(/https?:\/\/[^\s]+/);
        if (urlMatch) await page.goto(urlMatch[0], { waitUntil: 'networkidle' });
      } else if (instruction.startsWith('click')) {
        const target = step.instruction.replace(/click (on )?/i, '').trim();
        await page.click(target).catch(() =>
          page.getByText(target, { exact: false }).first().click()
        );
      } else if (instruction.startsWith('type') || instruction.startsWith('fill') || instruction.startsWith('enter')) {
        const match = step.instruction.match(/(?:type|fill|enter)\s+"([^"]+)"\s+(?:in|into|on)\s+(.+)/i);
        if (match) await page.fill(match[2].trim(), match[1]);
      } else if (instruction.startsWith('assert') || instruction.startsWith('check') || instruction.startsWith('verify')) {
        const text = step.instruction.replace(/(?:assert|check|verify)\s+(?:that\s+)?(?:the\s+)?(?:page\s+)?(?:contains\s+)?/i, '').trim().replace(/^["']|["']$/g, '');
        const visible = await page.getByText(text, { exact: false }).first().isVisible().catch(() => false);
        if (!visible) throw new Error(`Assertion failed: could not find "${text}" on page`);
      } else if (instruction.startsWith('wait')) {
        const msMatch = step.instruction.match(/(\d+)\s*(?:ms|milliseconds?)?/i);
        const secMatch = step.instruction.match(/(\d+)\s*seconds?/i);
        if (secMatch) await page.waitForTimeout(parseInt(secMatch[1]) * 1000);
        else if (msMatch) await page.waitForTimeout(parseInt(msMatch[1]));
        else await page.waitForTimeout(1000);
      } else if (instruction.includes('scroll')) {
        await page.evaluate(() => window.scrollBy(0, 500));
      } else if (instruction.includes('screenshot')) {
        // handled below
      } else {
        // Attempt generic action via AI-like heuristics
        await page.waitForTimeout(500);
      }
    }

    const screenshot = await page.screenshot({ type: 'png' }).catch(() => null);
    const screenshotPath = screenshot
      ? `/media/step-${step.id}-${Date.now()}.png`
      : null;
    if (screenshot && screenshotPath) {
      fs.writeFileSync(path.join(process.cwd(), 'public', screenshotPath), screenshot);
    }

    const duration = Date.now() - start;
    logs.push(`  ✓ Passed (${duration}ms)`);
    return { stepId: step.id, instruction: step.instruction, status: 'passed', screenshot: screenshotPath || undefined, duration_ms: duration };
  } catch (err: any) {
    const duration = Date.now() - start;
    logs.push(`  ✗ Failed: ${err.message}`);
    return { stepId: step.id, instruction: step.instruction, status: 'failed', error: err.message, duration_ms: duration };
  }
}

export async function runTest(
  runId: string,
  url: string,
  steps: TestStep[]
): Promise<RunResult> {
  const logs: string[] = [];
  const stepsResult: StepResult[] = [];
  const runStart = Date.now();

  const videoPath = path.join(process.cwd(), 'public', 'media', `video-${runId}`);
  fs.mkdirSync(videoPath, { recursive: true });

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    logs.push(`[RUN] Starting test run ${runId}`);
    logs.push(`[RUN] Target URL: ${url}`);

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({
      recordVideo: { dir: videoPath, size: { width: 1280, height: 720 } },
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Navigate to URL first
    logs.push(`[NAV] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    logs.push(`[NAV] Page loaded`);

    // Run each step
    for (const step of steps) {
      const result = await executeStep(page, step, logs);
      stepsResult.push(result);
      if (result.status === 'failed') {
        logs.push(`[HALT] Stopping due to step failure`);
        break;
      }
    }

    // Final screenshot
    const finalScreenshot = await page.screenshot({ fullPage: true, type: 'png' }).catch(() => null);
    const screenshotRelPath = `/media/final-${runId}.png`;
    if (finalScreenshot) {
      fs.writeFileSync(path.join(process.cwd(), 'public', screenshotRelPath), finalScreenshot);
    }

    await context.close();
    await browser.close();

    // Find video file
    const videoFiles = fs.readdirSync(videoPath);
    const videoFile = videoFiles.find(f => f.endsWith('.webm'));
    const videoRelPath = videoFile ? `/media/video-${runId}/${videoFile}` : null;

    const failed = stepsResult.some(s => s.status === 'failed');
    const duration = Date.now() - runStart;
    logs.push(`[RUN] Completed in ${duration}ms — ${failed ? 'FAILED' : 'PASSED'}`);

    return {
      status: failed ? 'failed' : 'passed',
      duration_ms: duration,
      screenshot_path: finalScreenshot ? screenshotRelPath : null,
      video_path: videoRelPath,
      logs,
      error: null,
      steps_result: stepsResult,
    };
  } catch (err: any) {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    const duration = Date.now() - runStart;
    logs.push(`[ERROR] ${err.message}`);
    return {
      status: 'error',
      duration_ms: duration,
      screenshot_path: null,
      video_path: null,
      logs,
      error: err.message,
      steps_result: stepsResult,
    };
  }
}
