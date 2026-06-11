import { config } from "../config.js";

/**
 * JSearch (RapidAPI) — aggregates Google for Jobs; returns
 * `job_posted_at_datetime_utc` (verified dates).
 * Free tier: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 */
export async function searchJSearch({ query, location, maxAgeDays }) {
  const { apiKey } = config.jsearch;
  if (!apiKey) {
    return { source: "jsearch", ok: false, reason: "missing key", jobs: [] };
  }
  const q = location ? `${query} in ${location}` : query;
  const params = new URLSearchParams({
    query: q,
    page: "1",
    num_pages: "1",
    date_posted: "month" // server-side coarse filter; exact 30-day filter applied later
  });
  const url = `https://jsearch.p.rapidapi.com/search?${params}`;
  try {
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
      }
    });
    if (!res.ok) {
      return { source: "jsearch", ok: false, reason: `HTTP ${res.status}`, jobs: [] };
    }
    const data = await res.json();
    const jobs = (data.data || []).map((r) => ({
      title: r.job_title || "Untitled",
      company: r.employer_name || "Unknown",
      location: [r.job_city, r.job_state, r.job_country].filter(Boolean).join(", ") || location || "",
      url: r.job_apply_link || r.job_google_link,
      postedAt: r.job_posted_at_datetime_utc || null,
      dateVerified: Boolean(r.job_posted_at_datetime_utc), // structured API field → verified
      salary: r.job_min_salary ? { min: r.job_min_salary, max: r.job_max_salary, predicted: false } : null,
      snippet: (r.job_description || "").slice(0, 280),
      source: "jsearch"
    }));
    return { source: "jsearch", ok: true, jobs };
  } catch (err) {
    return { source: "jsearch", ok: false, reason: err.message, jobs: [] };
  }
}
