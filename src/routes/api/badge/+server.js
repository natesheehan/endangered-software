// src/routes/api/badge/+server.js
import { json } from '@sveltejs/kit';
import { makeBadge } from 'badge-maker';

// --- keep these in a shared module if you prefer ---
function calculateHealthScore(m) {
  let score = 100;

  if (m.daysSinceLastUpdate > 365) score -= 30;
  else if (m.daysSinceLastUpdate > 180) score -= 20;
  else if (m.daysSinceLastUpdate > 90) score -= 10;

  const issueRatio = m.openIssues / (m.totalIssues || 1);
  if (issueRatio > 0.8) score -= 25;
  else if (issueRatio > 0.6) score -= 15;
  else if (issueRatio > 0.4) score -= 8;

  if (m.commitsLastYear < 10) score -= 20;
  else if (m.commitsLastYear < 50) score -= 10;
  else if (m.commitsLastYear < 100) score -= 5;

  if (m.recentContributors < 2) score -= 15;
  else if (m.recentContributors < 5) score -= 8;

  if (m.avgIssueAge > 365) score -= 10;
  else if (m.avgIssueAge > 180) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function getHealthStatus(score) {
  if (score >= 90) return { label: 'Thriving', color: 'brightgreen' };
  if (score >= 70) return { label: 'Least Concern', color: 'green' };
  if (score >= 60) return { label: 'Near Threatened', color: 'yellow' };
  if (score >= 40) return { label: 'Endangered', color: 'orange' };
  if (score >= 20) return { label: 'Critically Endangered', color: 'red' };
  return { label: 'Extinct', color: 'black' };
}

export async function GET(event) {
  const owner = event.url.searchParams.get('owner');
  const repo = event.url.searchParams.get('repo');

  if (!owner || !repo) {
    return json({ error: 'Missing owner/repo query params' }, { status: 400 });
  }

  // Call your existing analyzer (server-side, so token stays private)
  const res = await event.fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, repo })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const svg = makeBadge({
      label: 'Repo Health',
      message: 'error',
      color: 'lightgrey',
      style: 'flat'
    });

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        // short cache so it updates “often”
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  }

  const r = await res.json();

  // replicate your metric extraction
  const now = new Date();
  const daysSinceLastUpdate = Math.floor((now - new Date(r.pushedAt)) / 86400000);

  const openIssues = r.issues.totalCount;
  const closedIssues = r.closedIssues.totalCount;
  const totalIssues = openIssues + closedIssues;

  const openIssueAges = r.issues.nodes.map(
    (i) => Math.floor((now - new Date(i.createdAt)) / 86400000)
  );

  const avgIssueAge = openIssueAges.length
    ? Math.floor(openIssueAges.reduce((a, b) => a + b, 0) / openIssueAges.length)
    : 0;

  const commits = r.defaultBranchRef?.target?.history;
  const commitsLastYear = commits?.totalCount || 0;

  const recentContributors = new Set(
    commits?.nodes?.map((c) => c.author?.user?.login).filter(Boolean)
  ).size;

  const metrics = {
    openIssues,
    closedIssues,
    totalIssues,
    daysSinceLastUpdate,
    commitsLastYear,
    recentContributors,
    avgIssueAge
  };

  const healthScore = calculateHealthScore(metrics);
  const status = getHealthStatus(healthScore);

  const svg = makeBadge({
    label: 'Repo Health',
    message: `${healthScore} • ${status.label}`,
    color: status.color,
    style: 'flat'
  });

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Keep this short; GitHub and CDNs will still cache a bit.
      'Cache-Control': 'public, max-age=60, s-maxage=300'
    }
  });
}
