import { config } from "../config.js";
import { detectCountry } from "../lib/locations.js";

/**
 * Adzuna — structured job API with a real `created` date field (verified dates).
 * Free tier: https://developer.adzuna.com/
 */
export async function searchAdzuna({ query, location, maxAgeDays }) {
  const { appId, appKey } = config.adzuna;
  if (!appId || !appKey) {
    return { source: "adzuna", ok: false, reason: "missing key", jobs: [] };
  }
  const country = detectCountry(location);
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: query,
    results_per_page: "30",
    max_days_old: String(maxAgeDays),
    sort_by: "date",
    "content-type": "application/json"
  });
  if (location) params.set("where", location);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { source: "adzuna", ok: false, reason: `HTTP ${res.status}`, jobs: [] };
    }
    const data = await res.json();
    const jobs = (data.results || []).map((r) => ({
      title: r.title?.replace(/<[^>]+>/g, "") || "Untitled role",
      company: r.company?.display_name || "Unknown company",
      location: r.location?.display_name || location || "",
      url: r.redirect_url,
      postedAt: r.created || null,
      dateVerified: Boolean(r.created), // structured API field → verified
      salary: r.salary_min ? { min: r.salary_min, max: r.salary_max || null, predicted: r.salary_is_predicted === "1" } : null,
      snippet: (r.description || "").replace(/<[^>]+>/g, "").slice(0, 280),
      source: "adzuna"
    }));
    return { source: "adzuna", ok: true, jobs };
  } catch (err) {
    return { source: "adzuna", ok: false, reason: err.message, jobs: [] };
  }
}
