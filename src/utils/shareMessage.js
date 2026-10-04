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

// A new email with the subject and body filled in and no recipient (the owner picks it).
// encodeURIComponent turns line breaks, & and # into escapes, so the text cannot start a new
// parameter or end a header.
export const mailtoUrl = ({ subject, body }) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// WhatsApp with the text ready and no phone number (the owner picks the person).
export const whatsappUrl = ({ body }) => `https://wa.me/?text=${encodeURIComponent(body)}`;
