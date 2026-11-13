# Cold outreach playbook

The cold sequence is four short emails, plus "the note" for anyone who says yes. The specs are in `templates/`, and [GUIDE.md](GUIDE.md) explains how to build each one with `draft.js`. The note includes a phone screenshot of their own site, made with `mockup.js`.

| Step | When | Template | What it does |
|---|---|---|---|
| 1 | Day 1 | `cold-1-first-touch` | One real observation about their business and one small ask: "Shall I send the note?" |
| 2 | Day 3 | `cold-2-follow-up` | Reply in the same thread and list what the note covers |
| 3 | Day 7 | `cold-3-free-tip` | New thread with one fix they can make themselves |
| 4 | Day 14 | `cold-4-last-note` | Close the loop and leave the door open |
| ✓ | When they say yes | `cold-5-the-note` | The branded audit: what's good, what needs work, what's missing, and what it would take |

Stop the sequence as soon as they reply. Then use the reply that fits:

| They said | Send |
|---|---|
| "Yes", "sure", "let's talk" | `reply-interested`, then `cold-5-the-note` if they asked for the note |
| "How much?" | `reply-pricing` |
| "Send me details" | `reply-send-info` |
| "Not now" | `reply-not-now`, and set a reminder for the month you named |
| "Talk to X" | `reply-wrong-person` |
| "Not interested" | One line: "Understood, thanks for letting me know." Then stop. |

## Before you send: 10 minutes of research per lead

The first email only works if the observation is real. For each business, fill these in your sheet:

| Tag | How to find it | Example |
|---|---|---|
| `{{first_name}}` | Website "about" page, Google profile owner replies, LinkedIn | Asha |
| `{{company}}` | Their name as customers say it | Sunrise Dental Care |
| `{{city}}` | | Bhopal |
| `{{search_term}}` | What a customer would type into Google: service plus area | dentist in Arera Colony |
| `{{observation}}` | Search that term in an incognito window on your phone and note where they appear | on the second page, below three clinics with fewer reviews than yours |
| `{{load_time}}` | [PageSpeed Insights](https://pagespeed.web.dev), mobile, "Speed Index" rounded | 7 |
| `{{quick_win}}` | The single easiest fix on their Google profile | see the sample in `cold-3-free-tip` |
| `{{rating}}`, `{{review_count}}` | Google profile | 4.7, 180 |

If you can't find a real observation, skip the lead. A generic first email does more harm than none.

### Observations by type of business

Swap these into `{{observation}}`, and adjust the "For a resort in Indore…" proof line if a closer example fits.

- **Clinics and dentists:** "on the second page, below three clinics with fewer reviews than yours" / "with no way to book online, so every booking needs someone to pick up the phone"
- **Hotels, resorts, venues:** "on Booking.com but not on your own site, so every booking pays them a commission" / "with event enquiries going to a form that doesn't say when you'll reply"
- **Restaurants and cafés:** "with a menu that's a PDF photo, which is hard to read on a phone" / "with opening hours on Google that don't match your Instagram"
- **Coaching and training institutes:** "with no page for the course people search for most" / "with the enquiry form at the very bottom of a long page"
- **Salons and studios:** "with booking only by phone or Instagram DM" / "with the last Google photo from two years ago"
- **Real estate:** "with listings that open as images, so Google can't read them" / "on page two for '2 BHK in {{city}}'"
- **Shops and D2C brands:** "with a checkout that takes five screens on a phone" / "without your products showing in Google Shopping"

### Subject lines

Keep them short, lowercase-ish and specific. Rotate between:

- `{{company}} on Google` (default)
- `quick question about {{company}}`
- `{{search_term}}`
- `bookings from {{city}} searches`
- `{{company}}'s website on a phone`

Avoid "partnership", "proposal", "growth", exclamation marks and emoji.

## Sending rules

- **Warm up a new inbox with plain text.** For the first two weeks from a new address, send the `.txt` versions. After that, send the letter HTML: it's light (a few small images plus the signature) and looks far more considered. Build every email with `draft.js` (see [GUIDE.md](GUIDE.md)).
- **Volume:** start at 15 a day from a new address and add about 5 a day each week, up to 40. Never paste 100 addresses into one email.
- **Use a separate sending address on a second domain** once volume goes up, so the main inbox stays clean. Set up SPF, DKIM and DMARC before sending.
- **Send Tuesday to Thursday, 9:30 to 11:30 am** local time.
- **Personalise the first line every time.** The tags make it fast, but read each email once before it goes.
- **Track it in one sheet:** business, contact, email, `search_term`, `observation`, `load_time`, step sent, date, reply, next action.

## Other channels

The same message works shorter on WhatsApp and LinkedIn, once you have a reason to message:

> Hi {{first_name}}, I'm {{sender_name}} from Fieldwise. I searched "{{search_term}}" and {{company}} showed up {{observation}}. I've written a short note on three changes that would help. Can I send it here?

## What not to do

- No fake "Re:" on a first email, and no fake urgency or discounts.
- Don't attach PDFs to a first email.
- Don't claim results we can't show. The proof lines in these templates are real: the Indore resort (website, room booking, WhatsApp enquiries) and OffPay (11,700+ users in eight weeks, two in three from Google).
