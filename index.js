const axios = require('axios');
const { CronJob } = require('cron');

const { surfReport } = require('./surf-report');
const {
  surfReport: confReport,
  sms: confSms,
  cron: { refreshInterval },
} = require('./conf');

const cronJob = new CronJob(
  refreshInterval,
  async () => {
    try {
      // Getting Surf Report
      const forecast = await surfReport(confReport.spots, confReport.minStars);

      // Build SMS text (one SMS per spot)
      for (const { title, days } of forecast) {
        let msg = `${title}\n`;
        for (const { title, hours } of days) {
          msg += `\n${title}\n`;
          for (const { hour, stars } of hours) {
            msg += `${hour} ${'⭐'.repeat(stars)}\n`;
          }
        }
        // Send SMS
        await axios({
          method: 'POST',
          url: 'https://smsapi.free-mobile.fr/sendmsg',
          params: {
            user: confSms.user,
            pass: confSms.pass,
            msg,
          },
        });
      }
    } catch (err) {
      throw new Error(err);
    }
  },
  null,
  true,
  'Europe/Paris',
  this,
  true,
);

cronJob.start();
