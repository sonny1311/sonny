import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const jobPath = process.env.BOT_JOB || 'browser-bot/jobs/job.json';
const outDir = process.env.BOT_OUT || 'browser-bot/output';
const maxSteps = 100;

const allowedActions = new Set([
  'goto','click','fill','press','select','check','uncheck','wait','screenshot','assertText','assertUrl','html','stop'
]);

function assertSafeJob(job) {
  if (!job || typeof job !== 'object') throw new Error('Job must be an object');
  if (!Array.isArray(job.steps)) throw new Error('Job.steps must be an array');
  if (job.steps.length > maxSteps) throw new Error(`Too many steps (max ${maxSteps})`);
  for (const [i, step] of job.steps.entries()) {
    if (!step || typeof step !== 'object' || !allowedActions.has(step.action)) {
      throw new Error(`Unsupported action at step ${i + 1}`);
    }
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const raw = await fs.readFile(jobPath, 'utf8');
  const job = JSON.parse(raw);
  assertSafeJob(job);

  const log = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    ignoreHTTPSErrors: false
  });
  const page = await context.newPage();

  page.on('console', msg => log.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => log.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', req => log.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText || ''}`));

  let failed = false;
  let failure = null;
  let lastStep = 0;

  try {
    for (let i = 0; i < job.steps.length; i++) {
      const s = job.steps[i];
      lastStep = i + 1;
      log.push(`[step ${lastStep}] ${JSON.stringify({ ...s, value: s.secretEnv ? '<secret>' : s.value })}`);
      switch (s.action) {
        case 'goto':
          await page.goto(s.url, { waitUntil: s.waitUntil || 'domcontentloaded', timeout: s.timeout || 45000 });
          break;
        case 'click':
          await page.locator(s.selector).click({ timeout: s.timeout || 15000 });
          break;
        case 'fill': {
          const value = s.secretEnv ? process.env[s.secretEnv] : (s.value ?? '');
          if (s.secretEnv && !value) throw new Error(`Missing secret env: ${s.secretEnv}`);
          await page.locator(s.selector).fill(String(value), { timeout: s.timeout || 15000 });
          break;
        }
        case 'press':
          await page.locator(s.selector).press(s.key, { timeout: s.timeout || 15000 });
          break;
        case 'select':
          await page.locator(s.selector).selectOption(s.value, { timeout: s.timeout || 15000 });
          break;
        case 'check':
          await page.locator(s.selector).check({ timeout: s.timeout || 15000 });
          break;
        case 'uncheck':
          await page.locator(s.selector).uncheck({ timeout: s.timeout || 15000 });
          break;
        case 'wait':
          if (s.selector) await page.locator(s.selector).waitFor({ state: s.state || 'visible', timeout: s.timeout || 15000 });
          else await page.waitForTimeout(s.ms || 1000);
          break;
        case 'screenshot':
          await page.screenshot({ path: path.join(outDir, s.name || `step-${lastStep}.png`), fullPage: s.fullPage !== false });
          break;
        case 'assertText': {
          const text = await page.locator(s.selector).innerText({ timeout: s.timeout || 15000 });
          if (!text.includes(s.contains)) throw new Error(`Text assertion failed. Expected to contain: ${s.contains}`);
          break;
        }
        case 'assertUrl':
          if (!page.url().includes(s.contains)) throw new Error(`URL assertion failed. Current URL: ${page.url()}`);
          break;
        case 'html':
          await fs.writeFile(path.join(outDir, s.name || `step-${lastStep}.html`), await page.content(), 'utf8');
          break;
        case 'stop':
          log.push('[stop] Job requested stop');
          i = job.steps.length;
          break;
      }
      if (job.screenshotEachStep) {
        await page.screenshot({ path: path.join(outDir, `step-${String(lastStep).padStart(3,'0')}.png`), fullPage: true });
      }
    }
  } catch (err) {
    failed = true;
    failure = err instanceof Error ? err.stack || err.message : String(err);
    log.push(`[fatal] ${failure}`);
    try { await page.screenshot({ path: path.join(outDir, 'ERROR.png'), fullPage: true }); } catch {}
    try { await fs.writeFile(path.join(outDir, 'ERROR.html'), await page.content(), 'utf8'); } catch {}
  } finally {
    const summary = {
      ok: !failed,
      failed,
      failure,
      lastStep,
      finalUrl: page.url(),
      title: await page.title().catch(() => ''),
      timestamp: new Date().toISOString()
    };
    await fs.writeFile(path.join(outDir, 'result.json'), JSON.stringify(summary, null, 2), 'utf8');
    await fs.writeFile(path.join(outDir, 'bot.log'), log.join('\n') + '\n', 'utf8');
    await context.storageState({ path: path.join(outDir, 'storage-state.json') }).catch(() => {});
    await browser.close();
    if (failed) process.exitCode = 1;
  }
}

main().catch(async err => {
  await fs.mkdir(outDir, { recursive: true }).catch(() => {});
  await fs.writeFile(path.join(outDir, 'fatal.txt'), String(err?.stack || err), 'utf8').catch(() => {});
  process.exitCode = 1;
});
