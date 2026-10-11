import { describe, it, expect } from 'vitest';
import { surfReport } from './surf-report.js';

// A local page shaped like a spot page, so the scraper is checked against the
// browser puppeteer brings, without depending on the site
const SPOT = new URL('./__fixtures__/spot.html', import.meta.url).href;

describe('surfReport', () => {
  it('keeps the hours with enough stars, and the days holding one', async () => {
    expect(await surfReport([SPOT], 2)).toEqual([{
      title: 'Kerhilio',
      days: [{
        title: 'Samedi 11',
        hours: [{
          hour: '09h',
          stars: 3,
          waves: '1.2m',
          swell: { size: '1.5m', period: '12s', direction: 'O' },
          swellSecondary: { size: '0.5m', period: '8s', direction: '' },
          wind: { force: '10', direction: 'E' },
          weather: { sky: 'Soleil', temperature: '15°' },
        }],
      }],
    }]);
  }, 30000);

  it('leaves out a spot without any', async () => {
    expect(await surfReport([SPOT], 4)).toEqual([]);
  }, 30000);
});
