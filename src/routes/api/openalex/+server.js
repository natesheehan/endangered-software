import { json } from '@sveltejs/kit';

// POST { owner, repo, name, fullName, repoUrl? }
export async function POST({ request }) {
  const { owner, repo, name, fullName, repoUrl } = await request.json();

  if (!owner || !repo) {
    return json({ error: 'Missing owner/repo' }, { status: 400 });
  }

  // Best precision: search for the GitHub URL (people often cite the repo URL)
  const githubUrl = repoUrl?.trim() || `https://github.com/${owner}/${repo}`;
  const candidates = [
    githubUrl,
    `github.com/${owner}/${repo}`,
    fullName, // "owner/repo"
    name      // repo name
  ].filter(Boolean);

  // OpenAlex: search= searches title/abstract/fulltext; group_by aggregates into {key,count} buckets
  // Add mailto to join the "polite pool" (better limits/latency). Put *your* contact email here.
  // (You can also set it via User-Agent header; docs show either way.) :contentReference[oaicite:1]{index=1}
  const mailto = 'you@example.com';

  async function queryOpenAlex(searchTerm) {
const url =
  `https://api.openalex.org/works` +
  `?search=${encodeURIComponent(searchTerm)}` +
  `&group_by=publication_year` +
  `&per-page=200` +
  `&mailto=${encodeURIComponent(mailto)}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenAlex error (${res.status}): ${txt.slice(0, 200)}`);
    }

    const data = await res.json();

    // Group-by responses come back as an array of buckets like:
    // [{ key: "2020", key_display_name: "2020", count: 123 }, ...] :contentReference[oaicite:2]{index=2}
    const buckets = Array.isArray(data?.group_by) ? data.group_by : (Array.isArray(data) ? data : []);
    const total = buckets.reduce((sum, b) => sum + (b?.count || 0), 0);

    return { searchTerm, total, buckets };
  }

  // Try multiple search terms; pick the one with the highest total hits.
  let best = { searchTerm: candidates[0], total: 0, buckets: [] };

  for (const term of candidates) {
    try {
      const r = await queryOpenAlex(term);
      if (r.total > best.total) best = r;
    } catch {
      // ignore and keep trying other candidates
    }
  }

  // Normalize to a sorted series: [{year: 2018, count: 3}, ...]
  const series = (best.buckets || [])
    .map(b => ({
      year: Number(b.key),
      count: Number(b.count || 0)
    }))
    .filter(d => Number.isFinite(d.year) && Number.isFinite(d.count))
    .sort((a, b) => a.year - b.year);

  return json({
    query_used: best.searchTerm,
    total: best.total,
    series
  });
}
