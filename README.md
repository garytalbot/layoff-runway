# Layoff Runway

Layoff Runway is a static landing page plus in-browser calculator for one ugly but common question: after a layoff, how long can your cash actually last?

It gives people a fast estimate of:
- total available funds
- adjusted monthly burn
- projected cash-out date
- target spend for 3 / 6 / 12 months of runway
- biggest recurring costs to attack first
- plain-English survival recommendations

## Stack
- Plain HTML, CSS, and vanilla JavaScript
- No framework
- No backend
- No build step
- No tracking by default

## Project status
This repo is now public-release ready for a first launch pass:
- basic SEO and social metadata added
- favicon + social share card added
- web manifest, robots.txt, sitemap.xml added
- MIT license added
- Netlify config added with a few sensible security headers
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
- `assets/favicon.svg` — favicon
- `assets/og-card.svg` — social share image
- `site.webmanifest` — install metadata
- `robots.txt` — crawler rules
- `sitemap.xml` — sitemap placeholder
- `netlify.toml` — zero-build Netlify deploy config

## Before going fully public
Current live/public URL target:
- `https://garytalbot.github.io/layoff-runway/`

If you move to a custom domain later, update the canonical / OG / sitemap URLs.

## Fastest deploy paths
### Option 1: Netlify Drop or Netlify repo import
- Create a GitHub repo and push this folder
- Import it into Netlify
- Publish directory: `.`
- No build command needed

### Option 2: GitHub Pages
- Already configured for this repo
- URL: <https://garytalbot.github.io/layoff-runway/>
- Future pushes to `main` redeploy automatically

## Immediate next product moves
1. Wire the email form to Buttondown, Beehiiv, or ConvertKit.
2. Add privacy-friendly analytics.
3. Put a real domain on it.
4. Post it where recently laid-off people actually gather.

## License
MIT
