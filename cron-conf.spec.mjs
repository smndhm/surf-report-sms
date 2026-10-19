import { describe, it, expect } from 'vitest';
import { loadCron } from './cron-conf.js';

const SPOT = 'https://www.surf-report.com/meteo-surf/kerhilio-s1168.html';

const env = (overrides = {}) => ({
  CRON_NAME: 'surf-report',
  CRON_ARGUMENTS: JSON.stringify({ spots: [SPOT], minStars: 2 }),
  FREE_MOBILE_USER: '12345678',
  FREE_MOBILE_PASS: 'secret-pass',
  ...overrides,
});

describe('loadCron', () => {
  it('reads the cron and the credentials', () => {
    expect(loadCron(env())).toEqual({
      name: 'surf-report',
      spots: [SPOT],
      minStars: 2,
      sms: { user: '12345678', pass: 'secret-pass' },
    });
  });

  it('reads every spot', () => {
    const spots = [SPOT, 'https://www.surf-report.com/meteo-surf/another-spot-s0000.html'];
    expect(loadCron(env({ CRON_ARGUMENTS: JSON.stringify({ spots, minStars: 2 }) })).spots).toEqual(spots);
  });

  it('needs a name', () => {
    expect(() => loadCron(env({ CRON_NAME: ' ' }))).toThrow('CRON_NAME is not set.');
  });

  it('needs valid JSON', () => {
    expect(() => loadCron(env({ CRON_ARGUMENTS: '{ spots' }))).toThrow('CRON_ARGUMENTS is not valid JSON.');
  });

  it.each([[{ minStars: 2 }], [{ spots: [], minStars: 2 }], [{ spots: ['https://example.com/kerhilio'], minStars: 2 }]])('needs surf-report.com spots: %j', cronArguments => {
    expect(() => loadCron(env({ CRON_ARGUMENTS: JSON.stringify(cronArguments) }))).toThrow('"spots"');
  });

  it.each([undefined, -1, 6, 2.5, '2'])('needs minStars from 0 to 5: %j', minStars => {
    expect(() => loadCron(env({ CRON_ARGUMENTS: JSON.stringify({ spots: [SPOT], minStars }) }))).toThrow('"minStars"');
  });

  it('names a missing secret, never a value', () => {
    expect(() => loadCron(env({ FREE_MOBILE_PASS: '' }))).toThrow('Missing secret: FREE_MOBILE_PASS.');
  });
});
