const axios = require('axios');

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
  for (const { title, hours } of days) {
    msg += `\n${title}\n`;
    for (const { hour, stars } of hours) {
      msg += `${hour} ${'⭐'.repeat(stars)}\n`;
    }
  }
  return msg;
};

// The credentials travel in the query string, so the axios error, which keeps
// the request, is never rethrown: only its status is.
const sendSms = async ({ user, pass }, msg, request = axios) => {
  try {
    await request({
      method: 'POST',
      url: API_URL,
      params: { user, pass, msg },
    });
  } catch (err) {
    const status = err.response?.status;
    const reason = STATUSES[status] ?? (status ? 'unexpected answer' : 'no answer');
    // eslint-disable-next-line preserve-caught-error -- the cause holds the credentials
    throw new Error(`SMS not sent${status ? ` (HTTP ${status})` : ''}: ${reason}.`);
  }
};

module.exports = { buildMessage, sendSms };
