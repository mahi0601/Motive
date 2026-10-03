// A small CSV reader (RFC 4180 style), written here rather than pulled in as a
// dependency: quoted fields can hold the delimiter, quotes ("" is one quote) and
// line breaks; CRLF, CR and LF all end a record; a leading byte-order mark (Excel
// adds one) is dropped; the delimiter is detected from the header line (comma,
// semicolon or tab). Blank records are KEPT, so a record's position still matches its
// row number in the spreadsheet; the caller decides to ignore them.
const DELIMITERS = [',', ';', '\t'];

// Counts each delimiter in the first record, outside quotes; ties go to the comma.
const detectDelimiter = (s) => {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (c === '\n' || c === '\r')) break;
    else if (!inQuotes && c in counts) counts[c] += 1;
  }
  return DELIMITERS.reduce((best, d) => (counts[d] > counts[best] ? d : best), ',');
};

export const parseCsv = (text) => {
  let s = String(text ?? '');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const delimiter = detectDelimiter(s);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === '') {
      inQuotes = true; // a quote only opens a quoted field at the start of the field
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (inQuotes) throw new Error('The file has a quote that is never closed, so the rows after it cannot be read.');
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  // A file that is nothing but blank lines has no rows.
  return rows.every((r) => r.every((cell) => cell.trim() === '')) ? [] : rows;
};
