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
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    await sendSms(SMS, 'Hello ⭐ & co', request);
    expect(request).toHaveBeenCalledTimes(1);
    const [url, init] = request.mock.calls[0];
    expect(init).toEqual({ method: 'POST' });
    expect(url.origin + url.pathname).toBe('https://smsapi.free-mobile.fr/sendmsg');
    expect(Object.fromEntries(url.searchParams)).toEqual({ user: '12345678', pass: 'secret-pass', msg: 'Hello ⭐ & co' });
  });

  it('says what the status means, without the credentials', async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    const sent = sendSms(SMS, 'Hello', request);
    await expect(sent).rejects.toThrow('SMS not sent (HTTP 403): the service is not activated');
    await sent.catch((err) => {
      expect(JSON.stringify(err)).not.toContain('secret-pass');
      expect(err.cause).toBeUndefined();
    });
  });

  it('says when nothing answered', async () => {
    const request = vi.fn().mockRejectedValue(new TypeError('fetch failed', { cause: SMS }));
    const sent = sendSms(SMS, 'Hello', request);
    await expect(sent).rejects.toThrow('SMS not sent: no answer.');
    await sent.catch((err) => expect(err.cause).toBeUndefined());
  });
});
