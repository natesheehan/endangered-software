import { json } from '@sveltejs/kit';

// POST { owner, repo, name? }
export async function POST({ request }) {
  const { repo, name } = await request.json();

  // repo name is the thing we search for (ggplot2)
  const repoName = (name || repo || '').trim();
  if (!repoName) {
    return json({ error: 'Missing repo name' }, { status: 400 });
  }

  // OpenAlex polite pool (use your real email)
  const mailto = 'you@example.com';

  // Force phrase search by quoting it. (OpenAlex search is still "relevance search",
  // but quotes tends to reduce fuzziness a lot.)
  const term = `"${repoName}"`;

  const PER_PAGE = 200;
  const MAX_PAGES = 5;      // adjust if you want better recall
  const TIMEOUT_MS = 10_000;

  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
    } finally {
      clearTimeout(t);
    }
  };

  // Whole-word match for repo name in title (case-insensitive).
  // This avoids matching "myggplot2fork" etc.
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleWordRe = new RegExp(`\\b${escapeRe(repoName)}\\b`, 'i');

  function recordLooksLikeSoftware(work) {
    // Optional “precision knob”:
    // require "github" to appear somewhere in locations / landing pages.
    // This removes lots of non-software false positives, but may hide genuine mentions.
    const parts = [];

    // title is required anyway
    if (work?.title) parts.push(work.title);

    // locations often contain landing_page_url / pdf_url
    const locations = Array.isArray(work?.locations) ? work.locations : [];
    for (const loc of locations) {
      if (loc?.landing_page_url) parts.push(loc.landing_page_url);
      if (loc?.pdf_url) parts.push(loc.pdf_url);
    }

    const pl = work?.primary_location;
    if (pl?.landing_page_url) parts.push(pl.landing_page_url);
    if (pl?.pdf_url) parts.push(pl.pdf_url);

    const haystack = parts.join('\n').toLowerCase();

    // Toggle this on/off depending on how strict you want to be:
    const REQUIRE_GITHUB_HINT = false;

    if (REQUIRE_GITHUB_HINT && !haystack.includes('github.com')) return false;
    return true;
  }

  try {
    const matched = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const url =
        `https://api.openalex.org/works` +
        `?search=${encodeURIComponent(term)}` +
        `&per-page=${PER_PAGE}` +
        `&page=${page}` +
        `&mailto=${encodeURIComponent(mailto)}`;

      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`OpenAlex error (${res.status}): ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];

      for (const w of results) {
        // strict check: title contains the repo name as a whole word
        if (!w?.title || !titleWordRe.test(w.title)) continue;
        if (!recordLooksLikeSoftware(w)) continue;
        matched.push(w);
      }

      if (results.length < PER_PAGE) break;
      page += 1;
    }

    // Deduplicate by OpenAlex id
    const dedup = new Map();
    for (const w of matched) {
      if (w?.id && !dedup.has(w.id)) dedup.set(w.id, w);
    }

    // Aggregate counts per year
    const counts = new Map();
    for (const w of dedup.values()) {
      const y = Number(w?.publication_year);
      if (!Number.isFinite(y)) continue;
      counts.set(y, (counts.get(y) || 0) + 1);
    }

    const series = Array.from(counts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    return json({
      query_used: term,
      total: dedup.size,
      series
    });
  } catch (e) {
    return json({ error: e?.message || 'Failed to query OpenAlex' }, { status: 500 });
  }
}
