const puppeteer = require("puppeteer");

exports.surfReport = async (spots = [], nbMinStars = 0) => {
  try {
    let forecast = [];

    // launch browser
    const browser = await puppeteer.launch();

    // scan spots
    for (const spot of spots) {
      // new page
      const page = await browser.newPage();
      // go tu url
      await page.goto(spot);

      // Spot item
      let spotItem = {
        title: await page.title(),
        days: [],
      };

      // scan DOM
      const forecastTabs = await page.$$(".forecast-tab");

      for (const forecastTab of forecastTabs) {
        let dayItem = {
          title: await forecastTab.$eval(".title", (e) => e.textContent.trim()),
          hours: [],
        };

        const lines = await forecastTab.$$(
          ".content > .line:not(:first-child):not(.tides)"
        );

        for (const line of lines) {
          const stars = await line.$$eval(
            ".cell.stars .fa-star",
            (e) => e.length
          );
          if (stars >= nbMinStars) {
            dayItem.hours.push({
              hour: await line.$eval(".cell.date", (e) => e.textContent.trim()),
              stars,
              waves: await line.$eval(".cell.waves", (e) =>
                e.textContent.trim()
              ),
              swell: await line.$$eval(
                ".cell .swell:not(.secondary)",
                (swells) => {
                  return {
                    size: swells[0].textContent.trim(),
                    period: swells[1].textContent.trim(),
                    direction: swells[2].querySelectorAll("img").length
                      ? swells[2]
                          .querySelector("img")
                          .getAttribute("alt")
                          .trim()
                      : "",
                  };
                }
              ),
              swellSecondary: await line.$$eval(
                ".cell .swell.secondary",
                (swells) => {
                  return {
                    size: swells[0].textContent.trim(),
                    period: swells[1].textContent.trim(),
                    direction: swells[2].querySelectorAll("img").length
                      ? swells[2]
                          .querySelector("img")
                          .getAttribute("alt")
                          .trim()
                      : "",
                  };
                }
              ),
              wind: await line.$$eval(".cell .wind", (winds) => {
                return {
                  force: winds[0].textContent.trim(),
                  direction: winds[1].querySelectorAll("img").length
                    ? winds[1].querySelector("img").getAttribute("alt").trim()
                    : "",
                };
              }),
              weather: {
                sky: await line.$eval(".cell .weather img", (e) =>
                  e.getAttribute("alt").trim()
                ),
                temperature: await line.$eval(".cell .micro.temp", (e) =>
                  e.textContent.trim()
                ),
              },
            });
          }
        }

        if (dayItem.hours.length) {
          spotItem.days.push(dayItem);
        }
      }

      if (spotItem.days.length) {
        forecast.push(spotItem);
      }

      await page.close();
    }

    await browser.close();

    return forecast;
  } catch (err) {
    console.error(err);
  }
};
