import { describe, it, expect, vi } from 'vitest';
import { buildMessage, sendSms } from './sms.js';

const SMS = { user: '12345678', pass: 'secret-pass' };

describe('buildMessage', () => {
  it('lists each day and its hours', () => {
    expect(buildMessage({
      title: 'Kerhilio',
      days: [
        { title: 'Samedi 11', hours: [{ hour: '09h', stars: 3 }, { hour: '12h', stars: 2 }] },
        { title: 'Dimanche 12', hours: [{ hour: '18h', stars: 2 }] },
      ],
    })).toBe('Kerhilio\n\nSamedi 11\n09h ⭐⭐⭐\n12h ⭐⭐\n\nDimanche 12\n18h ⭐⭐\n');
  });
});

describe('sendSms', () => {
  it('posts the message to Free Mobile', async () => {
    const request = vi.fn().mockResolvedValue({ status: 200 });
    await sendSms(SMS, 'Hello', request);
    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://smsapi.free-mobile.fr/sendmsg',
      params: { user: '12345678', pass: 'secret-pass', msg: 'Hello' },
    });
  });

  it('says what the status means, without the credentials', async () => {
    const error = Object.assign(new Error('Request failed'), {
      response: { status: 403 },
      config: { params: SMS },
    });
    const request = vi.fn().mockRejectedValue(error);
    const sent = sendSms(SMS, 'Hello', request);
    await expect(sent).rejects.toThrow('SMS not sent (HTTP 403): the service is not activated');
    await sent.catch((err) => {
      expect(JSON.stringify(err)).not.toContain('secret-pass');
      expect(err.cause).toBeUndefined();
    });
  });

  it('says when nothing answered', async () => {
    const request = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    await expect(sendSms(SMS, 'Hello', request)).rejects.toThrow('SMS not sent: no answer.');
  });
});
