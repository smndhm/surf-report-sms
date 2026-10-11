import { describe, it, expect } from 'vitest';
import { surfReport } from './surf-report.js';

// A local page shaped like a spot page, so the scraper is checked against the
// browser puppeteer brings, without depending on the site
const SPOT = new URL('./__fixtures__/spot.html', import.meta.url).href;

// A page that loads but holds no forecast, as after a change of the site
const blank = (body) => `data:text/html,${encodeURIComponent(`<title>Changed</title>${body}`)}`;

describe('surfReport', () => {
  it('keeps the hours with enough stars, and the days holding one', async () => {
    expect(await surfReport([SPOT], 2)).toEqual([{
      url: SPOT,
      title: 'Kerhilio',
      days: [{ title: 'Samedi 11', hours: [{ hour: '09h', stars: 3 }] }],
    }]);
  }, 30000);

  it('reads a spot without any as a spot without days', async () => {
    expect(await surfReport([SPOT], 4)).toEqual([{ url: SPOT, title: 'Kerhilio', days: [] }]);
  }, 30000);

  it.each([
    ['no forecast', '', 'No forecast on the page'],
    ['no hour', '<div class="forecast-tab"><div class="title">Samedi</div><div class="content"><div class="line">Header</div></div></div>', 'No hour in the forecast'],
    ['a day without title', '<div class="forecast-tab"><div class="content"><div class="line">Header</div><div class="line"><div class="cell date">09h</div></div></div></div>', 'has no title'],
    ['an hour without time', '<div class="forecast-tab"><div class="title">Samedi</div><div class="content"><div class="line">Header</div><div class="line"><div class="cell stars"></div></div></div></div>', 'has no time'],
  ])('takes a page with %s for an error, not for calm seas', async (_, body, message) => {
    const [result] = await surfReport([blank(body)], 2);
    expect(result.error.message).toContain(message);
  }, 30000);

  it('keeps reading the other spots after one fails', async () => {
    const missing = new URL('./__fixtures__/missing.html', import.meta.url).href;
    const [failed, read] = await surfReport([missing, SPOT], 2);

    expect(failed.url).toBe(missing);
    expect(failed.error).toBeInstanceOf(Error);
    expect(read.title).toBe('Kerhilio');
  }, 30000);
});
