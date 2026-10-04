import { describe, test, expect } from 'vitest';
import { buildShareMessage, mailtoUrl, whatsappUrl, cleanName } from './shareMessage';

const LINK = 'https://app.example.test/s/' + 'a'.repeat(64);
const base = { workspaceName: 'Acme Redesign', link: LINK, canRespond: false };

describe('cleanName', () => {
  test('trims, collapses whitespace and keeps ordinary names as they are', () => {
    expect(cleanName('  Ann   Marie ')).toBe('Ann Marie');
    expect(cleanName('José')).toBe('José');
  });
  test('line breaks and control characters cannot become extra lines in a message or an email header', () => {
    expect(cleanName('Ann\r\nBcc: someone@example.invalid')).toBe('Ann Bcc: someone@example.invalid');
    expect(cleanName('A\u0000n\u0007n')).toBe('Ann');
  });
  test('is capped at 60 characters, and nothing gives an empty string', () => {
    expect(cleanName('x'.repeat(100))).toHaveLength(60);
    expect(cleanName('')).toBe('');
    expect(cleanName(undefined)).toBe('');
    expect(cleanName(null)).toBe('');
    expect(cleanName(5)).toBe('');
  });
});

describe('buildShareMessage', () => {
  test('greets the client by name, names the project, and puts the link on a line of its own', () => {
    const { body } = buildShareMessage({ ...base, clientName: 'Ann' });
    expect(body.startsWith('Hi Ann,\n')).toBe(true);
    expect(body).toContain('Acme Redesign');
    expect(body.split('\n')).toContain(LINK);
  });

  test('without a name it still reads naturally', () => {
    const { body } = buildShareMessage(base);
    expect(body.startsWith('Hi,\n')).toBe(true);
  });

  test('says no login is needed, because that is what makes a client open it', () => {
    expect(buildShareMessage(base).body).toMatch(/no login/i);
  });

  test('mentions approving and commenting only when the page lets clients respond', () => {
    expect(buildShareMessage({ ...base, canRespond: true }).body).toMatch(/approve|comment/i);
    expect(buildShareMessage({ ...base, canRespond: false }).body).not.toMatch(/approve|comment/i);
  });

  test('has a subject that names the project', () => {
    expect(buildShareMessage(base).subject).toBe('Acme Redesign: your project status page');
  });

  test('a missing project name falls back to a plain word instead of "undefined"', () => {
    const { body, subject } = buildShareMessage({ ...base, workspaceName: undefined });
    expect(body).not.toMatch(/undefined|null/);
    expect(subject).not.toMatch(/undefined|null/);
  });

  test('a project name with line breaks cannot add lines to the subject', () => {
    expect(buildShareMessage({ ...base, workspaceName: 'Acme\nBcc: x@example.invalid' }).subject).not.toContain('\n');
  });

  test('refuses anything that is not a web address, so it can never build a message around something else', () => {
    expect(() => buildShareMessage({ ...base, link: 'javascript:alert(1)' })).toThrow(/link/i);
    expect(() => buildShareMessage({ ...base, link: '' })).toThrow(/link/i);
    expect(() => buildShareMessage({ ...base, link: undefined })).toThrow(/link/i);
  });
});

describe('mailtoUrl', () => {
  test('is a mailto with no recipient, and the subject and body encoded', () => {
    const url = mailtoUrl({ subject: 'Acme: your page', body: 'Hi Ann,\n\nSee https://x.test/s/abc & more?' });
    expect(url.startsWith('mailto:?')).toBe(true);
    const params = new URLSearchParams(url.slice('mailto:?'.length));
    expect(params.get('subject')).toBe('Acme: your page');
    expect(params.get('body')).toBe('Hi Ann,\n\nSee https://x.test/s/abc & more?');
  });
  test('line breaks are encoded, not left to end the header', () => {
    expect(mailtoUrl({ subject: 's', body: 'a\r\nb' })).not.toMatch(/[\r\n]/);
  });
  test('a & or # in the text cannot start a new parameter', () => {
    const params = new URLSearchParams(mailtoUrl({ subject: 'a&b', body: 'x#y&cc=evil@example.invalid' }).slice(8));
    expect([...params.keys()].sort()).toEqual(['body', 'subject']);
  });
});

describe('whatsappUrl', () => {
  test('opens WhatsApp with the text and no phone number (the owner picks the person)', () => {
    const url = whatsappUrl({ body: 'Hi Ann,\n\nhttps://x.test/s/abc' });
    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(url.slice('https://wa.me/?text='.length))).toBe('Hi Ann,\n\nhttps://x.test/s/abc');
  });
});
