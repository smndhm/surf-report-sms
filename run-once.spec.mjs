import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runOnce } from './run-once.js';

const SPOT = 'https://www.surf-report.com/meteo-surf/kerhilio-s1168.html';

const FORECAST = [
  { title: 'Kerhilio', days: [{ title: 'Samedi 11', hours: [{ hour: '09h', stars: 3 }, { hour: '12h', stars: 2 }] }] },
  { title: 'Guidel', days: [{ title: 'Samedi 11', hours: [{ hour: '18h', stars: 2 }] }] },
];

let summary;
const env = () => ({
  CRON_NAME: 'kerhilio',
  CRON_ARGUMENTS: JSON.stringify({ spots: [SPOT], minStars: 2 }),
  FREE_MOBILE_USER: '12345678',
  FREE_MOBILE_PASS: 'secret-pass',
  GITHUB_STEP_SUMMARY: summary,
});

beforeEach(() => {
  summary = join(mkdtempSync(join(tmpdir(), 'surf-report-')), 'summary.md');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('runOnce', () => {
  it('sends one SMS per spot and sums it up', async () => {
    const scrape = vi.fn().mockResolvedValue(FORECAST);
    const send = vi.fn().mockResolvedValue();

    expect(await runOnce(env(), { scrape, send })).toBe(0);
    expect(scrape).toHaveBeenCalledWith([SPOT], 2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledWith({ user: '12345678', pass: 'secret-pass' }, 'Kerhilio\n\nSamedi 11\n09h ⭐⭐⭐\n12h ⭐⭐\n');
    expect(readFileSync(summary, 'utf8')).toBe([
      '## kerhilio',
      '',
      '- SMS sent for Kerhilio: 2 hours over 1 day',
      '- SMS sent for Guidel: 1 hour over 1 day',
      '',
    ].join('\n'));
  });

  it('sends nothing when no session is good enough', async () => {
    const send = vi.fn();

    expect(await runOnce(env(), { scrape: vi.fn().mockResolvedValue([]), send })).toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(readFileSync(summary, 'utf8')).toBe('## kerhilio\n\nNo session of 2 stars or more.\n');
  });

  it('keeps sending after a failed SMS, and counts it', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error('SMS not sent (HTTP 402): too many SMS sent in too short a time.'))
      .mockResolvedValueOnce();

    expect(await runOnce(env(), { scrape: vi.fn().mockResolvedValue(FORECAST), send })).toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
    expect(readFileSync(summary, 'utf8')).toContain('- **SMS not sent for Kerhilio**: SMS not sent (HTTP 402)');
  });

  it('checks the cron before starting the browser', async () => {
    const scrape = vi.fn();

    await expect(runOnce({ ...env(), FREE_MOBILE_USER: '' }, { scrape })).rejects.toThrow('Missing secret: FREE_MOBILE_USER.');
    expect(scrape).not.toHaveBeenCalled();
  });
});
