// The message an owner sends their client with the status page link: a short, friendly note
// that says what the link is, that no login is needed (what makes a client open it), and the
// link on a line of its own. Everything typed by a person (a name, a project name) is cleaned
// so it cannot add lines to the message or headers to an email, and the link must be a web
// address. The owner can edit the text before sending; nothing here is stored or sent anywhere.
const MAX_NAME = 60;
const MAX_PROJECT = 80;

const isControl = (ch) => {
  const code = ch.charCodeAt(0);
  return code < 32 || code === 127;
};
const isLineBreakOrTab = (ch) => ch === '\n' || ch === '\r' || ch === '\t';

// Line breaks and tabs become spaces; other control characters are dropped; runs of spaces
// collapse; the result is trimmed and capped.
const oneLine = (value, max) =>
  typeof value !== 'string'
    ? ''
    : [...value]
        .map((ch) => (isLineBreakOrTab(ch) ? ' ' : isControl(ch) ? '' : ch))
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);

export const cleanName = (value) => oneLine(value, MAX_NAME);

export const buildShareMessage = ({ clientName, workspaceName, link, canRespond }) => {
  if (typeof link !== 'string' || !/^https?:\/\//i.test(link)) throw new Error('A web link is needed to build the message.');
  const name = cleanName(clientName);
  const project = oneLine(workspaceName, MAX_PROJECT) || 'your project';
  const lines = [
    `Hi${name ? ` ${name}` : ''},`,
    '',
    `Here is a live page where you can see how ${project} is going, any time. No login needed.`,
    '',
    link,
  ];
  if (canRespond) lines.push('', 'You can approve milestones or leave a comment right on the page.');
  return { subject: `${project}: your project status page`, body: lines.join('\n') };
};

const MAX_ITEM = 80;
const MAX_ITEMS = 5;
const dateLabel = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};
const bullets = (title, items) => {
  const clean = items.map((t) => oneLine(t, MAX_ITEM)).filter(Boolean);
  if (!clean.length) return [];
  const shown = clean.slice(0, MAX_ITEMS).map((t) => `• ${t}`);
  if (clean.length > MAX_ITEMS) shown.push(`• and ${clean.length - MAX_ITEMS} more`);
  return [`*${title}*`, ...shown, ''];
};

// A short progress note from the owner's own facts (see the update-summary endpoint): what
// finished, what is under way, what is due soon and the next milestone, in plain text that reads
// well in WhatsApp (*bold*, bullets). The link is optional because the server cannot show it again
// after it is created; pass it only when the owner has it. Names and titles are cleaned like the
// share message, and each section is capped so the note stays short.
export const buildUpdateMessage = ({ clientName, workspaceName, summary, link }) => {
  const s = summary || {};
  const name = cleanName(clientName);
  const project = oneLine(workspaceName, MAX_PROJECT) || 'your project';
  const days = Number.isInteger(s.windowDays) && s.windowDays > 0 ? s.windowDays : 7;
  const lines = [`Hi${name ? ` ${name}` : ''},`, '', `Here is a quick update on ${project}.`, ''];
  lines.push(...bullets(`Done in the last ${days} days`, Array.isArray(s.shipped) ? s.shipped : []));
  lines.push(...bullets('In progress', Array.isArray(s.inProgress) ? s.inProgress : []));
  lines.push(
    ...bullets(
      'Coming up',
      (Array.isArray(s.upcoming) ? s.upcoming : []).map((t) => {
        const when = dateLabel(t?.due);
        return `${oneLine(t?.title, MAX_ITEM)}${when ? ` (${when})` : ''}`;
      }),
    ),
  );
  const next = s.milestone && oneLine(s.milestone.title, MAX_ITEM);
  if (next) {
    const when = dateLabel(s.milestone.date);
    lines.push(`Next milestone: ${next}${when ? `, ${when}` : ''}`, '');
  }
  if (typeof link === 'string' && /^https?:\/\//i.test(link)) lines.push('You can see it live any time, no login needed:', link);
  else lines.push('Let me know if you have any questions.');
  return { subject: `${project}: progress update`, body: lines.join('\n').trim() };
};

// A new email with the subject and body filled in and no recipient (the owner picks it).
// encodeURIComponent turns line breaks, & and # into escapes, so the text cannot start a new
// parameter or end a header.
export const mailtoUrl = ({ subject, body }) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// WhatsApp with the text ready and no phone number (the owner picks the person).
export const whatsappUrl = ({ body }) => `https://wa.me/?text=${encodeURIComponent(body)}`;
