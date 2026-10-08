# Privacy policy: what no longer matches reality

**Draft for review.** The live page (`src/pages/Privacy.jsx`) has not been changed. This is public-facing legal text, so it needs review by a qualified person before anything is published. Nothing below is legal advice.

## Statements to correct or add

| Section | Now true | Proposed change |
|---|---|---|
| Cookies | The auth cookie holds a refresh token tied to a server-side session. There is one session per sign-in, and signing out ends only that one. | Say "a session cookie (httpOnly, 30 days) that keeps you signed in on this device; signing out ends it". |
| Information we collect | We keep a security log of sign-ins, failed sign-ins, password resets, membership and plan changes, exports and deletions: user ids and a shortened IP (network only), no emails. Kept 180 days. | Add under technical data. |
| Information we collect | Uploaded files get a public, unguessable link. Anyone who has the link can open the file without signing in. | Add a plain sentence so people do not assume files are access-controlled. |
| Retention | Read notifications are deleted after 90 days, activity history after a year, finished invitations after 30 days, billing webhook records after 30 days, expired sessions on expiry. | Add a "How long we keep data" section. |
| Your choices | Settings → Account → **Download my data** gives a JSON copy; deleting the account also cancels a monthly subscription and removes uploaded files. | Mention both. |
| Email | We ask you to confirm your email address; confirming is required to invite people. | Mention under account details. |
| Data sharing | The web app may also be served from Vercel; Better Stack and Sentry receive logs and error reports with tokens and query strings removed. | Add Vercel; describe scrubbing. |
| Product analytics | The service records a few product events (sign-up, first task, status link created, status page viewed, client response, upgrade) as ids and event names only, with no cookies or tracking scripts. A view of a status page also stores a hash that changes daily and is derived from the visitor's network and browser, used only to count unique viewers. Kept 400 days. | Add under technical data, and say there is no third-party analytics. |
| Client sign-offs | When a client approves a milestone on a status page, the name they typed and the date are stored and shown to the workspace owner, who can export them. The public page shows only the date, not the name. | Add under content and under what is shown on shared links. |
| Client emails | An agency can add a client's email address to a status page. We store it, with an optional name, and send that person a weekly update email (task titles and dates) with a personal link and an unsubscribe link; the address is deleted when the agency removes it or the workspace is deleted. We also email the agency owner when a client responds. Sent through Resend. | Add under content, data sharing (Resend) and retention. The agency is the controller of its clients' addresses; decide the wording. |
| Children | The policy says it does not knowingly collect data from children. The app has no age gate. | Product/legal decision: add an age statement and a terms checkbox at sign-up, or leave as is. |
| Contact | `support@motive.app` is listed. | Confirm that mailbox exists and is monitored. |

## Open questions for the reviewer

- Does Clientglass act as a controller or a processor when a workspace is used by an organisation (for example a school)? Do those customers need a data processing agreement?
- Is a "last updated" date and a change notice to existing users needed when this changes?
- Do the retention periods above match what you are comfortable promising?
