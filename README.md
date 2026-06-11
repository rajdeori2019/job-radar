# 📡 JobRadar

**Open-source job search that only shows roles verifiably posted in the last 30 days. No ghost jobs, no dead links.**

Job boards are full of stale postings — roles filled months ago, expired listings, and "ghost jobs" that were never real. JobRadar solves one problem well: **every result with a green badge has a posting date that came from a structured API field, and it is at most 30 days old.**

## How it works

```
You type: job title + location
            │
            ▼
┌─────────────────────────────────────┐
│  PRIMARY — structured job APIs      │
│  • Adzuna (created field)           │   verified dates,
│  • JSearch / Google for Jobs        │   filtered to ≤ 30 days
│    (job_posted_at_datetime_utc)     │
└─────────────────────────────────────┘
            │  thin results?
            ▼
┌─────────────────────────────────────┐
│  FALLBACK — web search (Tavily)     │   restricted to trusted job
│  LinkedIn, Indeed, Naukri,          │   domains; ALWAYS labeled
│  Greenhouse, Lever, Glassdoor…      │   "date not verified"
└─────────────────────────────────────┘
            │
            ▼
   dedupe → freshness filter → results with a 30-day freshness meter
```

### The honesty rule

A job is marked **verified date** only when the date came from a structured API field. Dates guessed from page text or search snippets are never trusted — those results get an amber **"date not verified — check on page"** label and are hidden unless you opt in. This rule is enforced in code and in [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

```bash
git clone https://github.com/rajdeori2019/job-radar.git
cd job-radar
npm install
cp .env.example .env   # then add at least one free API key
npm start              # open http://localhost:3000
```

### Getting free API keys (~5 minutes each)

| Source | What it gives you | Sign up |
|---|---|---|
| **Adzuna** | Structured jobs with real posting dates, 20+ countries | https://developer.adzuna.com/ |
| **JSearch** (RapidAPI) | Google for Jobs aggregation, global, real timestamps | https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch |
| **Tavily** (optional) | Web-search fallback over trusted job boards | https://tavily.com/ |

You need **at least one** of Adzuna or JSearch. Keys live in your local `.env`, which is gitignored — they never leave your machine.

## API

`GET /api/search?q=react+developer&location=London&includeUnverified=false`

```json
{
  "query": "react developer",
  "location": "London",
  "maxAgeDays": 30,
  "fallbackUsed": false,
  "counts": { "total": 24, "verified": 24, "unverified": 0 },
  "sources": [{ "source": "adzuna", "ok": true, "count": 18 }],
  "jobs": [
    {
      "title": "React Developer",
      "company": "Example Ltd",
      "location": "London, UK",
      "url": "https://…",
      "postedAt": "2026-06-02T09:14:00Z",
      "dateVerified": true,
      "ageDays": 10,
      "source": "adzuna"
    }
  ]
}
```

`GET /api/health` — shows which sources have keys configured.

## Tests

```bash
npm test
```

Covers the 30-day boundary, deduplication across sources, the verified/unverified policy, sorting, and country detection.

## Limitations (honest ones)

- Posting date ≠ guarantee the role is still open; companies close roles early. Fresh ≠ open, but fresh strongly correlates with open.
- Coverage depends on the APIs: Adzuna covers ~20 countries; JSearch is global but rate-limited on the free tier.
- Web-search fallback results have no trustworthy date — that's exactly why they're labeled.

## Contributing

PRs welcome — new source adapters are the most valuable contribution. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially the verified-date rule.

## License

[MIT](LICENSE)
