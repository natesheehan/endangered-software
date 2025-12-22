<script>
  import {
    AlertCircle,
    TrendingDown,
    GitBranch,
    AlertTriangle,
    Activity,
    Clock
  } from 'lucide-svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';

  // `data` comes from the server load function
  export let data; // comes from load function
  const GITHUB_TOKEN = data.githubToken;

  let repoUrl = '';
  let loading = false;
  let analysis = null;
  let error = '';

// Badge variable
let badgeMarkdown = '';
let badgeUrl = '';

// Generate Shields.io badge URL and Markdown
const generateBadge = (analysis) => {
  const color = analysis.healthScore >= 80 ? 'green'
               : analysis.healthScore >= 60 ? 'yellow'
               : analysis.healthScore >= 40 ? 'orange'
               : 'red';

  const label = 'Repo Health';
  
  // Convert score and status to URL-safe string
  const score = analysis.healthScore;          // just a number
  const status = analysis.status.label
                  .toLowerCase()
                  .replace(/\s+/g, '_')      // spaces → underscores
                  .replace(/\//g, '-');      // slashes → dash
  
  const style = 'flat';

  const url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${score}_${status}-${color}?style=${style}`;
  
  badgeUrl = url;
  return `![${label}](${url})`;
};

// Copy Markdown to clipboard
const copyBadge = () => {
  navigator.clipboard.writeText(badgeMarkdown)
    .then(() => alert('Badge Markdown copied to clipboard!'))
    .catch(() => alert('Failed to copy badge.'));
};

// Update badgeMarkdown and badgeUrl whenever analysis changes
$: if (analysis) {
  badgeMarkdown = generateBadge(analysis);
}

  /* -----------------------------
     Helpers
  ------------------------------ */

  const parseGitHubUrl = (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  };

  const calculateHealthScore = (m) => {
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
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return { label: 'Thiriving', color: 'text-green-900', bg: 'bg-green-300' };
    if (score >= 70) return { label: 'Least Concern', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 60) return { label: 'Near Threatened ', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 40) return { label: 'Endangered', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (score >= 20) return { label: 'Critically Endangered', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Extinct', color: 'text-red-600', bg: 'bg-red-50' };
  };

  /* -----------------------------
     GraphQL fetch (single call)
  ------------------------------ */

  async function fetchGraphQL(query, variables) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify({ query, variables })
    });

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors[0].message);
    }
    return json.data;
  }

  /* -----------------------------
     Main analysis
  ------------------------------ */

  async function analyzeRepository() {
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      error = 'Please enter a valid GitHub repository URL.';
      return;
    }

    loading = true;
    error = '';
    analysis = null;

    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

const query = `
  query RepoHealth($owner: String!, $repo: String!, $since: GitTimestamp!) {
    repository(owner: $owner, name: $repo) {
      name
      nameWithOwner
      description
      createdAt
      pushedAt
      stargazerCount
      forkCount

      issues(first: 100, states: OPEN) {
        totalCount
        nodes {
          createdAt
        }
      }

      closedIssues: issues(first: 100, states: CLOSED) {
        totalCount
      }

      defaultBranchRef {
        target {
          ... on Commit {
            history(since: $since, first: 100) {
              totalCount
              nodes {
                author {
                  user {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;


      const data = await fetchGraphQL(query, {
        owner: parsed.owner,
        repo: parsed.repo,
        since: oneYearAgo.toISOString()
      });

      const r = data.repository;
      const now = new Date();

      const daysSinceLastUpdate = Math.floor(
        (now - new Date(r.pushedAt)) / 86400000
      );

      const openIssues = r.issues.totalCount;
      const closedIssues = r.closedIssues.totalCount;
      const totalIssues = openIssues + closedIssues;

      const openIssueAges = r.issues.nodes.map(
        i => Math.floor((now - new Date(i.createdAt)) / 86400000)
      );

      const avgIssueAge = openIssueAges.length
        ? Math.floor(openIssueAges.reduce((a, b) => a + b, 0) / openIssueAges.length)
        : 0;

      const commits = r.defaultBranchRef?.target?.history;
      const commitsLastYear = commits?.totalCount || 0;

      const recentContributors = new Set(
        commits?.nodes
          ?.map(c => c.author?.user?.login)
          .filter(Boolean)
      ).size;

      const metrics = {
        name: r.name,
        fullName: r.nameWithOwner,
        description: r.description,
        stars: r.stargazerCount,
        forks: r.forkCount,
        openIssues,
        closedIssues,
        totalIssues,
        daysSinceLastUpdate,
        commitsLastYear,
        recentContributors,
        avgIssueAge,
        created: new Date(r.createdAt).toLocaleDateString(),
        lastUpdated: new Date(r.pushedAt).toLocaleDateString()
      };

      const healthScore = calculateHealthScore(metrics);
      const status = getHealthStatus(healthScore);

      analysis = { ...metrics, healthScore, status };

    } catch (err) {
      error = err.message || 'Failed to analyze repository.';
    } finally {
      loading = false;
    }
  }
</script>

<Header/>
<div
  class="min-h-screen bg-gradient-to-br
         from-slate-50 to-slate-100
         dark:from-slate-950 dark:to-slate-900
         p-4 sm:p-8"
>
  <div class="max-w-5xl mx-auto">

    <!-- Header -->
    <div class="mb-8 text-center">
      <h1
        class="mb-2 flex items-center justify-center gap-3
               text-3xl sm:text-4xl font-bold
               text-slate-800 dark:text-slate-100"
      >
        <AlertTriangle class="text-orange-500" size={40} />
        Endangered Software Analyzer
        <AlertTriangle class="text-orange-500" size={40} />
      </h1>
      <p class="text-slate-600 dark:text-slate-400">
        Assess the health and maintenance risk of GitHub repositories
      </p>
    </div>

    <!-- Input Card -->
    <div
      class="mb-6 rounded-lg p-4 sm:p-6
             bg-white dark:bg-slate-900
             border border-slate-200 dark:border-slate-800
             shadow-lg"
    >
      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          bind:value={repoUrl}
          placeholder="https://github.com/owner/repo"
          class="flex-1 rounded-lg px-4 py-3
                 bg-white dark:bg-slate-950
                 border border-slate-300 dark:border-slate-700
                 text-slate-900 dark:text-slate-100
                 placeholder-slate-400 dark:placeholder-slate-500
                 focus:outline-none focus:ring-2 focus:ring-red-500"
          on:keydown={(e) => e.key === 'Enter' && analyzeRepository()}
        />

        <button
          on:click={analyzeRepository}
          disabled={loading}
          class="rounded-lg px-6 py-3
                 bg-red-600 hover:bg-red-700
                 text-white font-semibold
                 disabled:bg-slate-400 disabled:cursor-not-allowed
                 transition-colors"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {#if error}
        <div
          class="mt-4 flex gap-3 rounded-lg p-4
                 bg-red-50 dark:bg-red-950
                 border border-red-200 dark:border-red-900"
        >
          <AlertCircle class="text-red-500" size={20} />
          <p class="text-red-700 dark:text-red-300">{error}</p>
        </div>
      {/if}
    </div>

    {#if analysis}
      <div class="space-y-6">

        <!-- Repository Header -->
        <div
          class="rounded-lg p-4 sm:p-6
                 bg-white dark:bg-slate-900
                 border border-slate-200 dark:border-slate-800
                 shadow-lg"
        >
          <div class="mb-4 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div class="flex-1">
              <h2 class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {analysis.name}
              </h2>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                {analysis.fullName}
              </p>
              {#if analysis.description}
                <p class="mt-2 text-slate-700 dark:text-slate-300">
                  {analysis.description}
                </p>
              {/if}
            </div>

            <div class={`whitespace-nowrap rounded-lg px-4 py-2 ${analysis.status.bg}`}>
              <p class={`text-sm font-semibold ${analysis.status.color}`}>
                {analysis.status.label}
              </p>
            </div>
          </div>

          <!-- Health Score -->
          <div class="mt-6">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                Health Score
              </span>
              <span class={`text-2xl font-bold ${analysis.status.color}`}>
                {analysis.healthScore}/100
              </span>
            </div>

            <div class="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                class={`h-full transition-all duration-500
                  ${analysis.healthScore >= 80 ? 'bg-green-500'
                  : analysis.healthScore >= 60 ? 'bg-yellow-500'
                  : analysis.healthScore >= 40 ? 'bg-orange-500'
                  : 'bg-red-500'}`}
                style={`width: ${analysis.healthScore}%`}
              />
            </div>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">

          <!-- Activity Metrics -->
          <div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <Activity size={20} class="text-blue-500" /> Activity Metrics
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Last Updated</span>
                <span class="font-semibold text-slate-800 dark:text-slate-100">{analysis.lastUpdated}</span>
              </div>
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Days Since Update</span>
                <span class={`font-semibold ${analysis.daysSinceLastUpdate > 180 ? 'text-red-600' : analysis.daysSinceLastUpdate > 90 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.daysSinceLastUpdate}
                </span>
              </div>
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Commits (Last Year)</span>
                <span class={`font-semibold ${analysis.commitsLastYear < 50 ? 'text-red-600' : analysis.commitsLastYear < 100 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.commitsLastYear}
                </span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-slate-600 dark:text-slate-400">Recent Contributors</span>
                <span class={`font-semibold ${analysis.recentContributors < 3 ? 'text-red-600' : analysis.recentContributors < 5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.recentContributors}
                </span>
              </div>
            </div>
          </div>

          <!-- Issue Metrics -->
          <div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <AlertCircle size={20} class="text-orange-500" /> Issue Metrics
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Open Issues</span>
                <span class="font-semibold text-slate-600 dark:text-slate-400">{analysis.openIssues}</span>
              </div>
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Closed Issues</span>
                <span class="font-semibold text-slate-600 dark:text-slate-400">{analysis.closedIssues}</span>
              </div>
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Open / Total Ratio</span>
                <span class={`font-semibold ${(analysis.openIssues / analysis.totalIssues) > 0.7 ? 'text-red-600' : (analysis.openIssues / analysis.totalIssues) > 0.5 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.totalIssues > 0
                    ? `${((analysis.openIssues / analysis.totalIssues) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-slate-600 dark:text-slate-400">Avg Open Issue Age</span>
                <span class={`font-semibold ${analysis.avgIssueAge > 365 ? 'text-red-600' : analysis.avgIssueAge > 180 ? 'text-orange-600' : 'text-green-600'}`}>
                  {analysis.avgIssueAge} days
                </span>
              </div>
            </div>
          </div>

          <!-- Community Metrics -->
          <div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <GitBranch size={20} class="text-purple-500" /> Community Metrics
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Stars</span>
                <span class="font-semibold text-slate-600 dark:text-slate-400">{analysis.stars.toLocaleString()}</span>
              </div>
              <div class="flex justify-between border-b py-2 dark:border-slate-800">
                <span class="text-slate-600 dark:text-slate-400">Forks</span>
                <span class="font-semibold text-slate-600 dark:text-slate-400">{analysis.forks.toLocaleString()}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-slate-600 dark:text-slate-400">Created</span>
                <span class="font-semibold text-slate-600 dark:text-slate-400">{analysis.created}</span>
              </div>
            </div>
          </div>

          <!-- Risk Factors -->
          <div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <TrendingDown size={20} class="text-red-500" /> Risk Factors
            </h3>
            <div class="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {#if analysis.daysSinceLastUpdate > 180}
                <div class="flex gap-2"><AlertTriangle size={16} class="text-red-500" /> No updates in {analysis.daysSinceLastUpdate} days</div>
              {/if}
              {#if analysis.commitsLastYear < 50}
                <div class="flex gap-2"><AlertTriangle size={16} class="text-orange-500" /> Low commit activity</div>
              {/if}
              {#if analysis.recentContributors < 3}
                <div class="flex gap-2"><AlertTriangle size={16} class="text-orange-500" /> Few active contributors</div>
              {/if}
              {#if (analysis.openIssues / analysis.totalIssues) > 0.7}
                <div class="flex gap-2"><AlertTriangle size={16} class="text-red-500" /> High unresolved issue ratio</div>
              {/if}
              {#if analysis.avgIssueAge > 180}
                <div class="flex gap-2"><AlertTriangle size={16} class="text-orange-500" /> Old unresolved issues</div>
              {/if}
              {#if analysis.healthScore >= 80}
                <div class="flex gap-2"><Clock size={16} class="text-green-500" /> Repository appears well-maintained</div>
              {/if}
            </div>
          </div>
        </div>
        <!-- Badge Generator with Preview -->
<div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg mt-6">
  <h3 class="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
    GitHub Badge
  </h3>

  <!-- Live preview -->
  {#if badgeUrl}
    <div class="mb-2">
      <img src={badgeUrl} alt="Repository Health Badge" />
    </div>
  {/if}

  <p class="text-slate-600 dark:text-slate-400 mb-2">
    Copy and paste this Markdown to show a badge for this repository's health:
  </p>

  <div class="flex gap-2">
    <input
      type="text"
      readonly
      class="flex-1 px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      bind:value={badgeMarkdown}
    />
    <button
      on:click={copyBadge}
      class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
    >
      Copy
    </button>
  </div>

</div>

      </div>
    {/if}
  </div>
</div>

<Footer/>
