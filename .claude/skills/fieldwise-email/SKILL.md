---
name: fieldwise-email
description: Draft a Fieldwise email (cold outreach, replies, proposals, onboarding, updates, invoices, reports, newsletters) in the brand's look, using the template specs and draft.js in brand/email. Use whenever asked to write, draft or send an email for Fieldwise.
---

Read `email/GUIDE.md` (relative to the brand kit root) in full before drafting, then follow its workflow:

1. Pick the template from the table in section 3 and copy its JSON from `email/templates/` to `email/drafts/`.
2. For cold emails, research the business first (section 8). Run `node mockup.js <url> <name>` for the phone screenshot.
3. Rewrite the words for this person; keep the block structure. Fill every `{{tag}}` in a values JSON.
4. Run `node draft.js drafts/<file>.json --data drafts/<values>.json --png --eml --to <address>` from `email/`. Fix until it prints ✓ no issues.
5. Look at the PNG. Then create a Gmail draft from the `.eml` (section 7). Send only if the user asked.

Never hand-write email HTML, never invent facts or quotes, and use only the proof listed in section 6.
