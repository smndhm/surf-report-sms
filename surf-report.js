/* global document -- readDays runs in the page, not in Node */
const puppeteer = require('puppeteer');

// Each day of a spot page, and the time and stars of each of its hours. Read in
// the page, in one go: only what the SMS says, so a change to anything else on
// the page cannot break a run.
const readDays = () =>
  Array.from(document.querySelectorAll('.forecast-tab'), (tab) => ({
    title: tab.querySelector('.title')?.textContent.trim(),
    hours: Array.from(
      tab.querySelectorAll('.content > .line:not(:first-child):not(.tides)'),
      (line) => ({
        hour: line.querySelector('.cell.date')?.textContent.trim(),
        stars: line.querySelectorAll('.cell.stars .fa-star').length,
      }),
    ),
  }));

// A page the scraper cannot read is an error rather than a spot without waves:
// it is what a change in the site's markup looks like, and taking it for calm
// seas would mean no SMS ever again, on a green run.
const assertReadable = (days) => {
  if (days.length === 0) {
    throw new Error('No forecast on the page, has the site changed?');
  }
  // A single day may have no hour left late in the evening, never all of them
  if (days.every((day) => day.hours.length === 0)) {
    throw new Error('No hour in the forecast, has the site changed?');
  }
  if (days.some((day) => !day.title)) {
    throw new Error('A day of the forecast has no title, has the site changed?');
  }
  if (days.some((day) => day.hours.some((hour) => !hour.hour))) {
    throw new Error('An hour of the forecast has no time, has the site changed?');
  }
};

const readSpot = async (browser, url, minStars) => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    const days = await page.evaluate(readDays);
    assertReadable(days);

    return {
      url,
      title: await page.title(),
      days: days
        .map((day) => ({ ...day, hours: day.hours.filter((hour) => hour.stars >= minStars) }))
        .filter((day) => day.hours.length > 0),
    };
  } finally {
    await page.close();
  }
};

// One result per spot, in order: its title and the days holding an hour with
// enough stars, or the error that kept it from being read. A spot that fails
// does not keep the others from being read.
exports.surfReport = async (spots, minStars) => {
  const browser = await puppeteer.launch();
  try {
    const results = [];
    for (const url of spots) {
      try {
        results.push(await readSpot(browser, url, minStars));
      } catch (error) {
        results.push({ url, error });
      }
    }
    return results;
  } finally {
    // Closed either way, or the job never ends
    await browser.close();
  }
};
