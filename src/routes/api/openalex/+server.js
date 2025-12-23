import { json } from '@sveltejs/kit';

// POST { repo?, name? }
// Returns global per-year counts for OpenAlex default.search:<term>
export async function POST({ request }) {
  const { repo, name } = await request.json();

  const term = (name || repo || '').trim();
  if (!term) return json({ error: 'Missing repo name' }, { status: 400 });

  const mailto = 'you@example.com';
  const TIMEOUT_MS = 12_000;

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

  try {
    // Global aggregation over ALL matching works
    const url =
      `https://api.openalex.org/works` +
      `?filter=default.search:${encodeURIComponent(term)}` +
      `&group_by=publication_year` +
      `&mailto=${encodeURIComponent(mailto)}`;

    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`OpenAlex error (${res.status}): ${txt.slice(0, 200)}`);
    }

    const data = await res.json();

    // meta.count is the total number of works matching the search
    const total = Number.isFinite(Number(data?.meta?.count))
      ? Number(data.meta.count)
      : null;

    // group_by buckets: [{ key: "2020", count: 123 }, ...]
    const buckets = Array.isArray(data?.group_by) ? data.group_by : [];

    const series = buckets
      .map((b) => ({
        year: Number(b?.key),
        count: Number(b?.count || 0)
      }))
      .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.count))
      .sort((a, b) => a.year - b.year);

    return json({
      query_used: `default.search:${term}`,
      total,          // ✅ matches OpenAlex UI total
      series          // ✅ global per-year distribution
    });
  } catch (e) {
    return json({ error: e?.message || 'Failed to query OpenAlex' }, { status: 500 });
  }
}
