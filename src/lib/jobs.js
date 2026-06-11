/**
 * Core job-result logic: freshness filtering, deduplication, verification labeling.
 *
 * THE PROMISE (do not break — see CONTRIBUTING.md):
 * A job may only carry `dateVerified: true` when its posting date came from a
 * structured API field (e.g. Adzuna `created`, JSearch `job_posted_at_datetime_utc`).
 * Dates inferred from page text or search snippets are NEVER verified.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** True if isoDate is within maxAgeDays of `now` (inclusive). */
export function withinDays(isoDate, maxAgeDays, now = Date.now()) {
  if (!isoDate) return false;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return false;
  const age = now - t;
  return age >= 0 && age <= maxAgeDays * DAY_MS;
}

/** Age of a posting in whole days (0 = today). Returns null if unparseable. */
export function ageInDays(isoDate, now = Date.now()) {
  if (!isoDate) return null;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / DAY_MS));
}

function dedupeKey(job) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${norm(job.title)}|${norm(job.company)}|${norm(job.location)}`;
}

/**
 * Remove duplicate postings across sources. Verified-date entries win over
 * unverified ones; otherwise the first occurrence (source priority order) wins.
 */
export function dedupe(jobs) {
  const seen = new Map();
  for (const job of jobs) {
    const key = dedupeKey(job);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, job);
    } else if (!existing.dateVerified && job.dateVerified) {
      seen.set(key, job);
    }
  }
  return [...seen.values()];
}

/**
 * Apply the freshness + verification policy.
 * - Verified-date jobs older than maxAgeDays are dropped.
 * - Unverified-date jobs are excluded unless includeUnverified is true;
 *   when included they keep dateVerified:false so the UI labels them.
 * - Results sorted: verified first, then newest first.
 */
export function applyPolicy(jobs, { maxAgeDays = 30, includeUnverified = false, now = Date.now() } = {}) {
  const kept = [];
  for (const job of jobs) {
    if (job.dateVerified) {
      if (withinDays(job.postedAt, maxAgeDays, now)) {
        kept.push({ ...job, ageDays: ageInDays(job.postedAt, now) });
      }
    } else if (includeUnverified) {
      kept.push({ ...job, ageDays: ageInDays(job.postedAt, now) });
    }
  }
  kept.sort((a, b) => {
    if (a.dateVerified !== b.dateVerified) return a.dateVerified ? -1 : 1;
    return (a.ageDays ?? 999) - (b.ageDays ?? 999);
  });
  return kept;
}
