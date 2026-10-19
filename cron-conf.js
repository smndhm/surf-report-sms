// A cron is defined by the workflow that schedules it, so its definition
// travels in the environment rather than in a file of its own.
const CRON_NAME_ENV = 'CRON_NAME';
const CRON_ARGUMENTS_ENV = 'CRON_ARGUMENTS';
// The Free Mobile credentials are secrets, never written in a workflow
const SECRETS = ['FREE_MOBILE_USER', 'FREE_MOBILE_PASS'];

// The scraper only knows the pages of this site
const SPOT_URL = /^https:\/\/www\.surf-report\.com\/\S+$/;

const isRecord = value => typeof value === 'object' && value !== null && !Array.isArray(value);

// Validates the arguments a workflow hands over
const parseArguments = cronArguments => {
  if (!isRecord(cronArguments)) {
    throw new Error(`${CRON_ARGUMENTS_ENV}: needs an object with "spots" and "minStars".`);
  }
  const { spots, minStars } = cronArguments;
  if (!Array.isArray(spots) || spots.length === 0 || !spots.every(spot => typeof spot === 'string' && SPOT_URL.test(spot))) {
    throw new Error(`${CRON_ARGUMENTS_ENV}: "spots" needs an array of at least one https://www.surf-report.com/ page.`);
  }
  if (!Number.isInteger(minStars) || minStars < 0 || minStars > 5) {
    throw new Error(`${CRON_ARGUMENTS_ENV}: "minStars" must be a whole number from 0 to 5.`);
  }
  return { spots, minStars };
};

// Reads the cron the workflow defined, and the credentials from the secrets.
// Everything is checked before the browser starts, so a typo fails at once.
const loadCron = (env = process.env) => {
  const name = env[CRON_NAME_ENV];
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new Error(`${CRON_NAME_ENV} is not set.`);
  }

  let cronArguments;
  try {
    cronArguments = JSON.parse(env[CRON_ARGUMENTS_ENV] ?? '');
  } catch (cause) {
    // The workflows carry no secret, so the parse error is safe to keep
    throw new Error(`${CRON_ARGUMENTS_ENV} is not valid JSON.`, { cause });
  }
  const { spots, minStars } = parseArguments(cronArguments);

  // Names the missing secret, never a value
  const missing = SECRETS.filter(secret => !env[secret]);
  if (missing.length > 0) {
    throw new Error(`Missing secret: ${missing.join(', ')}.`);
  }

  return {
    name,
    spots,
    minStars,
    sms: { user: env.FREE_MOBILE_USER, pass: env.FREE_MOBILE_PASS },
  };
};

module.exports = { loadCron, CRON_NAME_ENV, CRON_ARGUMENTS_ENV };
