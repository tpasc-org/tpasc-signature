# TPASC Outlook Signature Generator

A self-serve tool for TPASC staff to generate their own Outlook email signature. Each person types in their own name, title, email, and (optionally) phone number — there is no central staff directory or list of names/emails stored anywhere in this project.

<!-- Optional: add a screenshot of the tool here once available, e.g.
![Tool screenshot](screenshots/tool-overview.png)
-->

## Why this exists

An earlier version of this tool used a centralized `staff-data.js` file listing every staff member's name, title, and email, with a dropdown to pick yourself from the list. IT flagged two problems: it was more complex than it needed to be, and hosting it anywhere public would expose every staff member's info in that one file.

This version removes the centralized directory entirely. Every field is typed in by the person using it, for themselves, at the moment they use it. No other person's information ever exists anywhere in this code or its data.

## How it works

Open `index.html` in a browser. Fill in the 4-step form, then click **Copy Signature**. This copies a ready-to-paste HTML signature to your clipboard — paste it directly into Outlook's signature settings (File → Options → Mail → Signatures).

No build step, no dependencies, no server required — it's a static HTML + JS page that runs entirely in the browser.

## The form, field by field

1. **Full name** — requires at least a first and last name (two or more words); auto-capitalizes each word as you type (e.g. `tobias troy` → `Tobias Troy`).
2. **Title** — free text, no restrictions.
3. **Email** — must end in `@tpasc.ca`; anything else is rejected before you can continue.
4. **Phone** — optional. A checkbox ("I don't have a direct line") lets you skip it entirely — the signature simply omits the phone row in that case. If you do enter one, it's validated by counting the actual digits (ignoring dashes/spaces/parentheses) and requiring exactly 10 — this catches malformed numbers that might otherwise "look" plausible by length alone.

Phone numbers are **self-reported and not cross-checked against any directory** — this was a deliberate call from IT (Behzad): trusting staff to enter their own correct number was judged simpler and sufficient, rather than validating against a master list (which would reintroduce the centralized-directory problem this redesign was meant to remove).

## What the generated signature contains

Name and title on the left. On the right: email, the TPASC address (styled as plain text but actually a clickable Google Maps search link), a "Get Directions" link, and operating hours ("Open seven days a week." / "5 a.m. – 12 a.m."). Below that: a "Dream big." tagline, a link to TPASC.CA, the full TPASC logo, and the standard email confidentiality disclaimer.

**Why the address link is invisible-styled:** an earlier version made it visually obvious as a link (color + underline), but it was judged distracting for a signature block — so it's styled identically to surrounding plain text while remaining fully clickable underneath.

**Why there's no embedded map image in the actual signature**, even though the tool's own page shows one: email clients (Outlook included) never render `<iframe>`s at all, for security reasons that apply industry-wide, not just to Outlook. A static map *image* was considered instead (via Google's Static Maps API), but that requires an API key embedded directly in the image's URL — since this signature gets pasted into potentially hundreds of outgoing emails, that key would be exposed to every single recipient and could be extracted and abused against TPASC's Google Cloud billing. A plain text link avoids this entirely while still getting people to the right map.

## The tool's own page (separate from the exported signature)

Everything below only appears while using the tool in a browser — none of it is part of what gets copied into your actual email signature:

- A small grayscale-tinted embedded Google Map near the logo, for a nicer at-a-glance sense of location while filling out the form.
- A decorative navy "running track" graphic behind the page content, styled after real indoor running tracks, at low opacity so it stays subtle.
- A small celebration animation when you click **Copy Signature** — three sports-themed objects (randomly chosen each time from a pool including a basketball, soccer ball, tennis ball, baseball, rugby ball, medal, tennis racket, and an F1-style helmet) are thrown across the screen in individual arcs, hand-drawn entirely with Canvas — no images or external assets involved.

## Security

- **Content Security Policy** (set via a `<meta>` tag in `index.html`) restricts the page to loading resources only from itself, TPASC's own image host, and Google (for the embedded map) — nothing else can load, connect out, or submit data anywhere.
- **Input sanitization** strips control characters from every typed field before it's used.
- **`noindex` meta tag + `robots.txt`** (see below) keep this page out of search engines, since it's an internal tool, not something meant to be publicly discoverable.

## Privacy / search visibility

This page is intentionally excluded from search engines two ways:
- A `<meta name="robots" content="noindex, nofollow">` tag in `index.html`'s `<head>` — tells any search engine that *does* visit the page not to list it in results.
- `robots.txt` (`Disallow: /`) — asks well-behaved crawlers not to visit the site at all in the first place.

It's not linked from TPASC's main website, and contains no staff data of any kind beyond what the current user of the tool types in for themselves.

## Files

- `index.html` — the tool itself (form, styling, live preview, security headers).
- `app.js` — validation logic, clipboard copy logic, and the canvas-drawn copy animation.
- `robots.txt` — asks search engines not to crawl this site.
- `.gitignore` — excludes OS/editor clutter (and, in the full project repo, local-only planning notes) from version control.

## Deployment

Hosted on GitHub Pages under the TPASC GitHub organization. See the project's internal deployment notes for the exact steps (repo settings, publishing source, optional custom domain) — not included here since they're specific to TPASC's internal GitHub/DNS setup rather than the tool itself.
