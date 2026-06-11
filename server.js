import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchJobs } from "./src/search.js";
import { sourceStatus } from "./src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, sources: sourceStatus() });
});

app.get("/api/search", async (req, res) => {
  const { q, location, includeUnverified } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: "Missing required parameter: q (job title / keywords)" });
  }
  try {
    const result = await searchJobs({
      query: q.trim(),
      location: (location || "").trim(),
      includeUnverified: includeUnverified === "true",
      maxAgeDays: 30
    });
    res.json(result);
  } catch (err) {
    console.error("Search failed:", err);
    res.status(500).json({ error: "Search failed. Check server logs." });
  }
});

app.listen(PORT, () => {
  console.log(`JobRadar running at http://localhost:${PORT}`);
  const status = sourceStatus();
  for (const [name, configured] of Object.entries(status)) {
    console.log(`  source ${name}: ${configured ? "configured" : "NO KEY (set in .env)"}`);
  }
});
