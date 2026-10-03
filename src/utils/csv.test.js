import { describe, test, expect } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  test('reads rows and fields', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([['a', 'b', 'c'], ['1', '2', '3']]);
  });

  test('a quoted field can hold commas, quotes ("" is one quote) and line breaks', () => {
    expect(parseCsv('t,d\n"Hello, world","She said ""hi"""\n"line1\nline2",x')).toEqual([
      ['t', 'd'],
      ['Hello, world', 'She said "hi"'],
      ['line1\nline2', 'x'],
    ]);
  });

  test('handles CRLF, a lone CR and no trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
    expect(parseCsv('a,b\r1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  test('a byte-order mark at the start (Excel adds one) is not part of the first header', () => {
    expect(parseCsv('﻿title,status\nA,done')[0]).toEqual(['title', 'status']);
  });

  test('detects semicolons (common in European Excel) and tabs', () => {
    expect(parseCsv('title;status\nA;done')).toEqual([['title', 'status'], ['A', 'done']]);
    expect(parseCsv('title\tstatus\nA\tdone')).toEqual([['title', 'status'], ['A', 'done']]);
  });

  test('commas inside quotes do not make a semicolon file look comma-separated', () => {
    expect(parseCsv('title;note\n"a, b, c, d";x')).toEqual([['title', 'note'], ['a, b, c, d', 'x']]);
  });

  test('keeps blank records in place, so row numbers still match the spreadsheet; only a trailing newline adds nothing', () => {
    const rows = parseCsv('a,b\n\n1,2\n');
    expect(rows).toHaveLength(3);
    expect(rows[1].every((c) => c === '')).toBe(true);
    expect(rows[2]).toEqual(['1', '2']);
  });

  test('a quote in the middle of an unquoted field is just a character', () => {
    expect(parseCsv('a\n5" pipe')).toEqual([['a'], ['5" pipe']]);
  });

  test('spaces and empty fields are kept as they are', () => {
    expect(parseCsv('a,b,c\n x ,,y')).toEqual([['a', 'b', 'c'], [' x ', '', 'y']]);
  });

  test('an unterminated quote is an error that says so, not silently swallowed rows', () => {
    expect(() => parseCsv('a,b\n"oops,1\n2,3')).toThrow(/quote/i);
  });

  test('empty input has no rows', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('\n')).toEqual([]);
  });

  test('a header only', () => {
    expect(parseCsv('title,status')).toEqual([['title', 'status']]);
  });

  test('handles a large file quickly', () => {
    const big = `title\n${Array.from({ length: 20000 }, (_, i) => `Task ${i}`).join('\n')}`;
    const t = Date.now();
    expect(parseCsv(big)).toHaveLength(20001);
    expect(Date.now() - t).toBeLessThan(1500);
  });
});
