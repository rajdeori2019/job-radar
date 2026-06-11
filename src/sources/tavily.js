import { config } from "../config.js";

/**
 * Tavily — web-search FALLBACK, domain-restricted to reputable job boards.
 * Web search cannot guarantee posting dates, so results from this source
 * are ALWAYS dateVerified: false. The UI labels them "date not verified".
 * Free tier: https://tavily.com/
 */
const TRUSTED_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "naukri.com",
  "glassdoor.com",
  "boards.greenhouse.io",
  "jobs.lever.co",
  "wellfound.com",
  "weworkremotely.com",
  "remoteok.com"
];

export async function searchTavily({ query, location }) {
  const { apiKey } = config.tavily;
  if (!apiKey) {
    return { source: "tavily", ok: false, reason: "missing key", jobs: [] };
  }
  const q = `${query} job opening ${location || ""} posted`.trim();
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: q,
        search_depth: "basic",
        max_results: 10,
        include_domains: TRUSTED_DOMAINS,
        days: 30
      })
    });
    if (!res.ok) {
      return { source: "tavily", ok: false, reason: `HTTP ${res.status}`, jobs: [] };
    }
    const data = await res.json();
    const jobs = (data.results || []).map((r) => ({
      title: r.title || "Untitled",
      company: hostOf(r.url),
      location: location || "",
      url: r.url,
      postedAt: null,
      dateVerified: false, // web search NEVER yields a verified date
      salary: null,
      snippet: (r.content || "").slice(0, 280),
      source: "tavily"
    }));
    return { source: "tavily", ok: true, jobs };
  } catch (err) {
    return { source: "tavily", ok: false, reason: err.message, jobs: [] };
  }
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}
