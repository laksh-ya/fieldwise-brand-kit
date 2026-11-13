# Fieldwise email templates

Every email Fieldwise sends, in the brand kit's look: mark No. 06 in Field glass, Inter, sand and near-black, and the tagline "Grow where it counts."

**Preview all of them:** https://fieldwise-brand-kit.vercel.app/email/ (desktop and phone widths, light and dark, copy and download buttons)

## What's here

| Group | Emails |
|---|---|
| Cold outreach | `cold-1-first-touch`, `cold-2-follow-up`, `cold-3-free-tip`, `cold-4-last-note`, `cold-5-the-note` (see [cold-outreach.md](cold-outreach.md)) |
| Replies | `reply-interested`, `reply-pricing`, `reply-send-info`, `reply-not-now`, `reply-wrong-person` |
| Winning the project | `enquiry-reply`, `call-confirmed`, `proposal`, `proposal-follow-up` |
| During the project | `welcome`, `project-update`, `launch` |
| Billing | `invoice`, `payment-reminder`, `payment-received` |
| After launch | `monthly-report`, `review-request`, `newsletter` |
| Basics | `signature` |

There are two styles:

- **Plain:** a personal email, as if written in Gmail, with just the signature. Use it for cold emails, replies and follow-ups.
- **Branded:** logo, a sea-glass banner on some, a sand panel for details, a green pill button, and the footer with the mark. Use it for things a client keeps: the note, proposals, welcome, updates, invoices, receipts and reports.

## Files

```
dist/templates/<id>.html   send-ready HTML; {{tags}} left in, images loaded from the hosted kit
dist/templates/<id>.txt    plain-text version; the subject is on the first line
dist/samples/<id>.html     the same email filled with sample data (Sunrise Dental Care)
dist/index.html            the preview gallery
dist/assets/               logo, mark, stones and banners (PNG at 3x, banners as JPEG)
cold-outreach.md           the cold email playbook: sequence, research, subject lines, sending rules
```

## How to send them

- **Gmail, one email at a time:** open the sample in the gallery, change the details, click **copy email**, and paste into a new message. Tables, buttons and images survive the paste.
- **Cold emails:** use the `.txt` version as plain text (see the playbook for why).
- **Signature:** open `dist/templates/signature.html` in a browser, replace `{{sender_name}}` and `{{sender_role}}`, select all, copy, and paste into Gmail > Settings > General > Signature.
- **Mail tools** (Brevo, Mailchimp, Instantly, GMass): paste the HTML from `dist/templates/` into a custom-HTML template. The `{{tags}}` use `{{snake_case}}`; rename them to your tool's format if it differs (e.g. `{{ contact.FIRSTNAME }}` in Brevo).

`sender_name` and `sender_role` appear in every signature. The other tags are listed per email under **tags** in the gallery.

## Editing

All copy lives in `templates.js` and the layout in `build.js`. Don't edit the files in `dist/` by hand.

```
node build.js              rebuild dist/ (checks that every tag has a sample value)
node export-assets.js      re-render the images from ../kit (needs Playwright and Chrome; only when the logo or palette changes)
```

To change contact details or the image host, edit `BRAND` at the top of `build.js`. Images in the send-ready HTML load from `https://fieldwise-brand-kit.vercel.app/email/assets/`. If you move the hosting, change `BRAND.assets` and rebuild.

## Built to work in

- **Clients:** Gmail (web and app), Apple Mail and iOS Mail, Outlook (web, and Windows via MSO fallbacks), and Android mail apps.
- **Layout:** tables with inline styles, 600 px wide, stacking on phones.
- **Dark mode:** dark colours and a white logo in clients that support it.
- **Fonts:** Inter loads where the client allows it and falls back to the system sans.
- **Accessibility:** every image has an alt text or is decorative, and buttons are real links.

## Writing rules

- **Short:** one idea per paragraph and one ask per email.
- **Specific:** outcomes and numbers, not adjectives.
- **Honest:** every claim is true. The proof lines (the Indore resort, OffPay) come from `content/*/sources.md`.
- **Nothing extra:** no exclamation marks, emoji, fake urgency, or "hope this finds you well".
- Emails come from Fieldwise. The sender's name appears only in the signature.
