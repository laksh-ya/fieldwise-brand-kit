# Agents: writing Fieldwise emails

Read [GUIDE.md](GUIDE.md) before drafting any email. The essentials:

1. Copy the closest spec from `templates/` into `drafts/` (section 3 of the guide picks it).
2. Rewrite every sentence for the real person and business. The samples describe a fictional dental clinic.
3. Build it with `node draft.js drafts/<file>.json --data <values.json> --png --eml --to <address>`.
4. Fix every ✗ error and read every ! warning, then look at the PNG.
5. Create a draft for the user. Don't send unless told to.

Never hand-write email HTML. Never invent numbers, results or quotes. Never leave `{{tags}}` or `sample-*` images in an email that goes out.
