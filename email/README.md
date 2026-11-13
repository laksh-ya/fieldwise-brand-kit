# Fieldwise emails

Every email Fieldwise sends, built from one set of brand blocks: mark No. 06 in Field glass, Inter, sand and slate, and "Grow where it counts."

- **Gallery** (every template, phone and desktop widths, light and dark, copy and download): https://fieldwise-brand-kit.vercel.app/email/
- **How to write one**, for people and AI agents: [GUIDE.md](GUIDE.md)
- **Cold outreach playbook:** [cold-outreach.md](cold-outreach.md)

```bash
node draft.js templates/cold-1-first-touch.json --sample --png   # try it: builds drafts/cold-1-first-touch.{html,txt,png}
node mockup.js https://example.com example                       # frame any site on a phone and in a browser
node build.js                                                    # rebuild every template and the gallery into dist/
```

## Files

| Path | What it is |
|---|---|
| `templates/*.json` | One spec per email: subject, preheader and blocks. Copy one to start a new email. |
| `sample.json` | Sample values for every `{{tag}}`, used for previews |
| `lib/render.js` | The blocks (hero, phone, work, steps, stats…), email-safe HTML, dark mode, checks |
| `draft.js` | Builds one email from a spec and runs the checks; makes `.html`, `.txt`, `.png` and `.eml` files |
| `mockup.js` | Captures a website and frames it on a phone and in a browser |
| `export-assets.js` | Renders the logo, stones, banners and frames from `../kit` |
| `assets/` | Images used by the emails (also hosted at `fieldwise-brand-kit.vercel.app/email/assets`) |
| `dist/` | Built templates (`{{tags}}` left in), filled samples and the gallery |
| `docs/` | Screenshots used in the guide |

There are 24 templates:

| Group | Templates |
|---|---|
| Cold outreach | first email, follow-up, free fix, last note, and the note |
| Replies | interested, pricing, send details, not now, wrong person |
| Winning the project | enquiry reply, call booked, proposal, proposal follow-up |
| During the project | welcome, weekly update, site is live |
| Billing | invoice, payment reminder, payment received |
| After launch | monthly report, review request, newsletter |

`all-blocks` shows every block in one email, and there's a Gmail signature too.

**Requirements:**
- `draft.js` and `build.js` need only Node 18 or later.
- Previews (`--png`), `mockup.js` and `export-assets.js` also need Playwright with Chrome (`npm i -D playwright-core`).
