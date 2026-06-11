import test from "node:test";
import assert from "node:assert/strict";
import { withinDays, ageInDays, dedupe, applyPolicy, DAY_MS } from "../src/lib/jobs.js";
import { detectCountry } from "../src/lib/locations.js";

const NOW = Date.parse("2026-06-12T12:00:00Z");
const daysAgo = (n) => new Date(NOW - n * DAY_MS).toISOString();

test("30-day boundary: 29 days old is kept", () => {
  assert.equal(withinDays(daysAgo(29), 30, NOW), true);
});

test("30-day boundary: 31 days old is dropped", () => {
  assert.equal(withinDays(daysAgo(31), 30, NOW), false);
});

test("future or unparseable dates are not 'within'", () => {
  assert.equal(withinDays(daysAgo(-2), 30, NOW), false);
  assert.equal(withinDays("not-a-date", 30, NOW), false);
  assert.equal(withinDays(null, 30, NOW), false);
});

test("ageInDays computes whole days", () => {
  assert.equal(ageInDays(daysAgo(5), NOW), 5);
  assert.equal(ageInDays(daysAgo(0), NOW), 0);
  assert.equal(ageInDays(null, NOW), null);
});

test("dedupe removes duplicates across sources, prefers verified", () => {
  const a = { title: "HR Manager", company: "Acme Corp", location: "London", dateVerified: false, source: "tavily" };
  const b = { title: "HR  manager!", company: "ACME corp", location: "london", dateVerified: true, source: "adzuna" };
  const out = dedupe([a, b]);
  assert.equal(out.length, 1);
  assert.equal(out[0].dateVerified, true);
  assert.equal(out[0].source, "adzuna");
});

test("policy: unverified hidden by default, included when asked, always labeled", () => {
  const jobs = [
    { title: "A", company: "X", location: "", postedAt: daysAgo(3), dateVerified: true },
    { title: "B", company: "Y", location: "", postedAt: null, dateVerified: false }
  ];
  const strict = applyPolicy(jobs, { maxAgeDays: 30, includeUnverified: false, now: NOW });
  assert.equal(strict.length, 1);
  assert.equal(strict[0].title, "A");

  const loose = applyPolicy(jobs, { maxAgeDays: 30, includeUnverified: true, now: NOW });
  assert.equal(loose.length, 2);
  const unv = loose.find((j) => j.title === "B");
  assert.equal(unv.dateVerified, false);
});

test("policy: verified-but-stale jobs are dropped even with includeUnverified", () => {
  const jobs = [{ title: "Old", company: "Z", location: "", postedAt: daysAgo(45), dateVerified: true }];
  const out = applyPolicy(jobs, { maxAgeDays: 30, includeUnverified: true, now: NOW });
  assert.equal(out.length, 0);
});

test("policy: sorts verified first, then newest first", () => {
  const jobs = [
    { title: "older", company: "X", location: "", postedAt: daysAgo(20), dateVerified: true },
    { title: "unverified", company: "Y", location: "", postedAt: null, dateVerified: false },
    { title: "newer", company: "Z", location: "", postedAt: daysAgo(2), dateVerified: true }
  ];
  const out = applyPolicy(jobs, { maxAgeDays: 30, includeUnverified: true, now: NOW });
  assert.deepEqual(out.map((j) => j.title), ["newer", "older", "unverified"]);
});

test("country detection", () => {
  assert.equal(detectCountry("Bengaluru"), "in");
  assert.equal(detectCountry("Guwahati, Assam"), "in");
  assert.equal(detectCountry("London"), "gb");
  assert.equal(detectCountry("Sydney"), "au");
  assert.equal(detectCountry(""), "us");
  assert.equal(detectCountry("somewhere unknown"), "us");
});
