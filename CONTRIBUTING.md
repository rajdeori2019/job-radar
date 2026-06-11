# Contributing to JobRadar

Thanks for helping! The most valuable contributions are **new source adapters** (more countries, more boards) and UI improvements.

## The one rule that cannot be broken

> **A job may only be marked `dateVerified: true` when its posting date comes from a structured API field.**

Examples of structured fields: Adzuna `created`, JSearch `job_posted_at_datetime_utc`, Greenhouse `updated_at`, Lever `createdAt`.

NOT acceptable as verified: dates scraped from page text, "posted 2 weeks ago" strings from search snippets, crawl dates, `<meta>` publish dates. If your adapter cannot get a structured date, set `postedAt: null, dateVerified: false` — the UI will label it honestly.

PRs that mark unverified dates as verified will be rejected. This rule is the product.

## Adding a source adapter

1. Create `src/sources/<name>.js` exporting `search<Name>({ query, location, maxAgeDays })`.
2. Return `{ source, ok, reason?, jobs }` — never throw; return `ok: false` with a reason instead.
3. Each job: `{ title, company, location, url, postedAt, dateVerified, salary, snippet, source }`.
4. Wire it into `src/search.js` and add its key to `src/config.js` + `.env.example`.
5. Add tests if you touch `src/lib/`.

## Dev setup

```bash
npm install
cp .env.example .env   # add keys
npm run dev            # auto-reload server
npm test
```

## Code style

Plain Node + ES modules, no build step, no framework on the frontend. Keep it dependency-light — that's deliberate, so anyone can read the whole codebase in 20 minutes.

## Security

Never commit `.env` or API keys. If you find a security issue, open a private report rather than a public issue.
