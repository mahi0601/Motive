import { describe, test, expect } from 'vitest';
import { buildSignoffCsv } from './signoffCsv';

const row = (over = {}) => ({ kind: 'approve', milestoneTitle: 'Design sign-off', authorName: 'Ann', message: 'Looks good', createdAt: '2026-10-12T09:30:00.000Z', ...over });

describe('buildSignoffCsv', () => {
  test('has a header that says the name is unverified, then one row per approval', () => {
    const lines = buildSignoffCsv([row(), row({ authorName: 'Bo', createdAt: '2026-10-13T10:00:00.000Z' })]).split('\r\n');
    expect(lines[0]).toBe('Milestone,Approved by (typed by the sender; not verified),Approved on (UTC),Message');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('Design sign-off,Ann,2026-10-12 09:30,Looks good');
  });

  test('quotes fields that contain commas, quotes or line breaks', () => {
    const csv = buildSignoffCsv([row({ message: 'Fine, but "later"\nthanks' })]);
    expect(csv).toContain('"Fine, but ""later""\nthanks"');
  });

  test('neutralises spreadsheet formulas typed by a client', () => {
    const csv = buildSignoffCsv([row({ authorName: '=HYPERLINK("http://evil","x")', message: '+1+1', milestoneTitle: '@SUM(A1)' })]);
    const dataLine = csv.split('\r\n').slice(1).join('\r\n');
    expect(dataLine).toContain("'=HYPERLINK");
    expect(dataLine).toContain("'+1+1");
    expect(dataLine).toContain("'@SUM(A1)");
  });

  test('a milestone that was cleared later still shows something readable', () => {
    expect(buildSignoffCsv([row({ milestoneTitle: null })]).split('\r\n')[1].startsWith('(no milestone),')).toBe(true);
  });

  test('an empty list is just the header', () => {
    expect(buildSignoffCsv([]).split('\r\n')).toHaveLength(1);
  });
});
