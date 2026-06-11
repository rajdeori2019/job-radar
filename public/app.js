const form = document.getElementById("search-form");
const btn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const chipsEl = document.getElementById("source-chips");
const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = document.getElementById("q").value.trim();
  const location = document.getElementById("location").value.trim();
  const includeUnverified = document.getElementById("include-unverified").checked;
  if (!q) return;

  btn.disabled = true;
  btn.textContent = "Searching…";
  resultsEl.innerHTML = "";
  statusEl.classList.add("hidden");

  try {
    const params = new URLSearchParams({ q, location, includeUnverified: String(includeUnverified) });
    const res = await fetch(`/api/search?${params}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    render(data);
  } catch (err) {
    resultsEl.innerHTML = `<div class="error">Search failed: ${escapeHtml(err.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Search fresh jobs";
  }
});

function render(data) {
  statusEl.classList.remove("hidden");

  chipsEl.innerHTML = data.sources
    .map((s) => {
      const cls = s.ok ? "ok" : "fail";
      const note = s.ok ? `${s.count}` : s.reason || "error";
      return `<span class="chip ${cls}">${escapeHtml(s.source)}: ${escapeHtml(String(note))}</span>`;
    })
    .join("");

  const { total, verified, unverified } = data.counts;
  summaryEl.textContent =
    `${total} fresh result${total === 1 ? "" : "s"} for "${data.query}" in ${data.location} — ` +
    `${verified} with verified dates${unverified ? `, ${unverified} unverified (labeled)` : ""}` +
    (data.fallbackUsed ? " · web-search fallback used" : "");

  if (!data.jobs.length) {
    resultsEl.innerHTML = `<div class="empty">No verified postings in the last ${data.maxAgeDays} days.
      Try broader keywords, another location, or enable unverified results.</div>`;
    return;
  }

  resultsEl.innerHTML = data.jobs.map(jobCard).join("");
}

function jobCard(job) {
  const badge = job.dateVerified
    ? `<span class="badge verified">verified date</span>`
    : `<span class="badge unverified">date not verified — check on page</span>`;

  const salary = job.salary
    ? `<span> · ${formatSalary(job.salary)}</span>`
    : "";

  return `
  <article class="job">
    <h3><a href="${escapeAttr(job.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(job.title)}</a>${badge}</h3>
    <p class="meta">${escapeHtml(job.company)} · ${escapeHtml(job.location || "location unspecified")}
      · via ${escapeHtml(job.source)}${salary}</p>
    ${job.snippet ? `<p class="snippet">${escapeHtml(job.snippet)}…</p>` : ""}
    ${freshnessMeter(job)}
  </article>`;
}

/** 30-day freshness meter: green (fresh) → amber (aging). */
function freshnessMeter(job) {
  if (job.ageDays === null || job.ageDays === undefined) {
    return `<div class="freshness"><div class="bar"><div class="fill" style="width:0%"></div></div>
      <div class="label">posting date unknown</div></div>`;
  }
  const pct = Math.min(100, Math.round((job.ageDays / 30) * 100));
  const remaining = 100 - pct;
  const color = job.ageDays <= 7 ? "var(--green)" : job.ageDays <= 21 ? "var(--amber)" : "var(--red)";
  const when = job.ageDays === 0 ? "posted today" : `posted ${job.ageDays} day${job.ageDays === 1 ? "" : "s"} ago`;
  const date = job.postedAt ? ` (${new Date(job.postedAt).toLocaleDateString()})` : "";
  return `<div class="freshness">
    <div class="bar"><div class="fill" style="width:${remaining}%;background:${color}"></div></div>
    <div class="label">${when}${date} — ${30 - job.ageDays} of 30 freshness days left</div>
  </div>`;
}

function formatSalary(s) {
  const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n);
  const range = s.max && s.max !== s.min ? `${fmt(s.min)}–${fmt(s.max)}` : fmt(s.min);
  return `${range}${s.predicted ? " (estimated)" : ""}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function escapeAttr(str) {
  const s = String(str || "");
  return /^https?:\/\//i.test(s) ? escapeHtml(s) : "#";
}
