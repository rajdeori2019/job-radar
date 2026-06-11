import { searchAdzuna } from "./sources/adzuna.js";
import { searchJSearch } from "./sources/jsearch.js";
import { searchTavily } from "./sources/tavily.js";
import { dedupe, applyPolicy } from "./lib/jobs.js";

const FALLBACK_THRESHOLD = 5; // run web-search fallback only when verified results are thin

/**
 * Hybrid search: structured job APIs first (verified dates),
 * domain-restricted web search as fallback (always labeled unverified).
 */
export async function searchJobs({ query, location, includeUnverified = false, maxAgeDays = 30 }) {
  const primary = await Promise.all([
    searchAdzuna({ query, location, maxAgeDays }),
    searchJSearch({ query, location, maxAgeDays })
  ]);

  let all = primary.flatMap((r) => r.jobs);
  const sources = primary.map(({ source, ok, reason, jobs }) => ({
    source,
    ok,
    reason: reason || null,
    count: jobs.length
  }));

  const verifiedFresh = applyPolicy(all, { maxAgeDays, includeUnverified: false });
  let fallbackUsed = false;

  if (verifiedFresh.length < FALLBACK_THRESHOLD) {
    const tavily = await searchTavily({ query, location });
    sources.push({ source: "tavily", ok: tavily.ok, reason: tavily.reason || null, count: tavily.jobs.length });
    if (tavily.ok && tavily.jobs.length > 0) {
      fallbackUsed = true;
      all = all.concat(tavily.jobs);
    }
  }

  const jobs = applyPolicy(dedupe(all), { maxAgeDays, includeUnverified });

  return {
    query,
    location: location || "anywhere",
    maxAgeDays,
    fallbackUsed,
    counts: {
      total: jobs.length,
      verified: jobs.filter((j) => j.dateVerified).length,
      unverified: jobs.filter((j) => !j.dateVerified).length
    },
    sources,
    jobs
  };
}
