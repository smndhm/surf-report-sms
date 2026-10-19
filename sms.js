const API_URL = 'https://smsapi.free-mobile.fr/sendmsg';

// What the Free Mobile API means by each status it answers
const STATUSES = {
  400: 'a parameter is missing',
  402: 'too many SMS sent in too short a time',
  403: 'the service is not activated on the account, or the credentials are wrong',
  500: 'error on the Free Mobile side, try again later',
};

// One SMS per spot: its title, then each day and the hours worth it
const buildMessage = ({ title, days }) => {
  let msg = `${title}\n`;
  for (const { title: day, hours } of days) {
    msg += `\n${day}\n`;
    for (const { hour, stars } of hours) {
      msg += `${hour} ${'⭐'.repeat(stars)}\n`;
    }
  }
  return msg;
};

// The credentials travel in the query string, so a failure is described by its
// status alone, never by the request or the error that carries it.
const sendSms = async ({ user, pass }, msg, request = fetch) => {
  const url = new URL(API_URL);
  url.searchParams.set('user', user);
  url.searchParams.set('pass', pass);
  url.searchParams.set('msg', msg);

  let response;
  try {
    response = await request(url, { method: 'POST' });
  } catch {
    throw new Error('SMS not sent: no answer.');
  }
  if (!response.ok) {
    const reason = STATUSES[response.status] ?? 'unexpected answer';
    throw new Error(`SMS not sent (HTTP ${response.status}): ${reason}.`);
  }
};

module.exports = { buildMessage, sendSms };
