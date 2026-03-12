# Layoff Runway

Layoff Runway is a static landing page plus in-browser calculator for one ugly but common question: after a layoff, how long can your cash actually last?

It gives people a fast estimate of:
- total available funds
- adjusted monthly burn
- projected cash-out date
- target spend for 3 / 6 / 12 months of runway
- biggest recurring costs to attack first
- plain-English survival recommendations

## Live links
- App: <https://garytalbot.github.io/layoff-runway/>
- Work hub / other shipped projects: <https://garytalbot.github.io/garytalbot-site/work/>
- GitHub profile: <https://github.com/garytalbot>

## More from Gary
- [Unit Price Checker](https://garytalbot.github.io/unit-price-checker/) — grocery and household unit-price math with mixed-unit conversion, packs, and coupons.
- [Signal Garden](https://garytalbot.github.io/signal-garden/) — a browser toy for planting glowing procedural blooms.

## Stack
- Plain HTML, CSS, and vanilla JavaScript
- No framework
- No backend
- No build step
- No tracking by default
- Provider-free interim email capture via `mailto:` + clipboard fallback

## Project status
This repo is now public-release ready for a first launch pass:
- basic SEO and social metadata added
- favicon + social share card added
- FAQPage structured data added for better search/legitimacy signals
- trust / privacy / disclaimer copy added so the page explains itself faster
- web manifest, robots.txt, sitemap.xml added
- MIT license added
- Netlify config added with a few sensible security headers
- provider-free email CTA now opens a prewritten checklist request in the visitor's email app and includes an optional runway snapshot
- results now include a simple interpretation guide so people know what to do with a 0–3, 3–6, or 6+ month result
- results now include a bridge planner that shows the monthly-burn gap or upfront cash needed to reach 3 / 6 / 12 months
- results now include quick what-if comparisons so people can see how a housing reset, bridge income, or both would change their runway before they rewrite the whole budget
- starter scenario cards now preview rough runway before you click, so a new visitor can pick a believable situation faster instead of guessing blind
- shareable plain-English snapshot button added for pasting the result to a partner, roommate, friend, or advisor
- exact-result share links added, so the current scenario can be copied/shared as a URL with the numbers loaded on open — no backend required
- copied snapshots now include the nearest bridge-to-safer-runway line so the summary travels with a next-step number, not just vibes
- starter scenarios now let people load common layoff situations in one click, reducing blank-page friction and giving them a sane place to begin before editing their own numbers
- clipboard fallback added so the CTA still works if `mailto:` is flaky
- git repo initialized and committed

## Local development
From this directory:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Files
- `index.html` — landing page and calculator UI
- `assets/styles.css` — styling
- `assets/app.js` — calculator logic
- `assets/favicon.svg` plus derived app icons (`favicon-16.png`, `favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) — favicon/app-icon surface
- `assets/og-card.svg` — social share image
- `site.webmanifest` — install metadata
- `robots.txt` — crawler rules
- `sitemap.xml` — sitemap placeholder
- `netlify.toml` — zero-build Netlify deploy config
- `docs/launch-assets.md` — X, Indie Hackers, and Hacker News launch/distribution copy

## Deployment notes
- The live public URL is <https://garytalbot.github.io/layoff-runway/>.
- Future pushes to `main` redeploy automatically through GitHub Pages.
- If you move to a custom domain later, update the canonical / OG / sitemap URLs.

## Immediate next product moves
1. Replace the interim `mailto:` CTA with Buttondown, Beehiiv, or ConvertKit once the offer proves it can pull replies.
2. Add privacy-friendly analytics.
3. Put a real domain on it.
4. Post it where recently laid-off people actually gather.

## License
MIT
