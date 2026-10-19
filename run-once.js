const { appendFileSync } = require('fs');

const { loadCron } = require('./cron-conf');
const { surfReport } = require('./surf-report');
const { buildMessage, sendSms } = require('./sms');

// Reads better than the log, at the top of the run's page
const renderSummary = (name, minStars, sent, errors) => {
  const lines = [`## ${name}`, ''];

  if (sent.length === 0 && errors.length === 0) {
    lines.push(`No session of ${minStars} stars or more.`);
  }
  sent.forEach(({ title, days }) => {
    const hours = days.reduce((total, day) => total + day.hours.length, 0);
    lines.push(`- SMS sent for ${title}: ${hours} hour${hours === 1 ? '' : 's'} over ${days.length} day${days.length === 1 ? '' : 's'}`);
  });
  errors.forEach(({ spot, message }) => {
    lines.push(`- **${spot}**: ${message}`);
  });

  return `${lines.join('\n')}\n`;
};

// GITHUB_STEP_SUMMARY is only set on a runner, so a local run writes nothing
const writeSummary = (summary, env) => {
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, summary);
  }
};

// Runs the cron the workflow defined, then returns the number of spots that
// could not be read or sent so the caller can exit accordingly. A spot that
// fails does not keep the others from being read and sent.
const runOnce = async (env = process.env, { scrape = surfReport, send = sendSms } = {}) => {
  const cron = loadCron(env);
  console.log(`Cron ${cron.name} started, ${cron.spots.length} spot(s), ${cron.minStars} stars or more`);

  const results = await scrape(cron.spots, cron.minStars);

  const sent = [];
  const errors = [];
  const fail = (spot, message) => {
    errors.push({ spot, message });
    console.error(`${spot}: ${message}`);
  };

  for (const result of results) {
    if (result.error) {
      fail(result.url, `not read: ${result.error.message}`);
      continue;
    }
    if (result.days.length === 0) {
      console.log(`Nothing for ${result.title}`);
      continue;
    }
    try {
      await send(cron.sms, buildMessage(result));
      sent.push(result);
      console.log(`SMS sent for ${result.title}`);
    } catch (err) {
      fail(result.title, err.message);
    }
  }

  console.log(`Cron ${cron.name} ended, ${sent.length} SMS sent, ${errors.length} error(s)`);
  writeSummary(renderSummary(cron.name, cron.minStars, sent, errors), env);
  return errors.length;
};

module.exports = { runOnce, renderSummary };

// Entry point, `pnpm cron:once`
if (require.main === module) {
  runOnce()
    .then(errors => {
      process.exitCode = errors > 0 ? 1 : 0;
    })
    .catch(err => {
      console.error(err);
      process.exitCode = 1;
    });
}
