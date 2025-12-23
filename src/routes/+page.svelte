<script>
  import {
    AlertCircle,
    TrendingDown,
    GitBranch,
    AlertTriangle,
    Activity,
    Clock,
    Search
  } from 'lucide-svelte';
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';



  let repoUrl = '';
  let loading = false;
  let analysis = null;
  let error = '';

  let openAlexLoading = false;
let openAlexError = '';
let openAlex = null; // { query_used, total, series: [{year,count}] }

  let yearsBack = 20;        // default view: last 20 years
  let chartStyle = 'bars';   // optional: future-proof if you add line style later

  // Keep series within [currentYear - yearsBack + 1, currentYear]
  $: currentYear = new Date().getFullYear();

  $: openAlexFiltered =
    openAlex?.series?.length
      ? openAlex.series
          .filter(d => d.year >= currentYear - (yearsBack - 1) && d.year <= currentYear)
          .sort((a, b) => a.year - b.year)
      : [];

  $: maxCount = openAlexFiltered.length
    ? Math.max(...openAlexFiltered.map(d => d.count), 1)
    : 1;

async function fetchOpenAlexMentions() {
  if (!analysis) return;

  openAlexLoading = true;
  openAlexError = '';
  openAlex = null;

  const [owner, repo] = analysis.fullName.split('/');

  try {
    const res = await fetch('/api/openalex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner,
        repo,
        name: analysis.name,
        fullName: analysis.fullName,
        repoUrl // you already have this bound to the input
      })
    });

    const data = await res.json();
    if (!res.ok || data?.error) throw new Error(data?.error || 'Failed to query OpenAlex');

    openAlex = data;
  } catch (e) {
    openAlexError = e.message || 'Failed to query OpenAlex';
  } finally {
    openAlexLoading = false;
  }
}

// Automatically fetch when analysis is ready
$: if (analysis) {
  fetchOpenAlexMentions();
}


// Badge variable
let badgeMarkdown = '';
let badgeUrl = '';

// Generate Shields.io badge URL and Markdown
const PUBLIC_BASE_URL = 'https://endangered-software.vercel.app/'; // <-- your deployed domain

const generateBadge = (analysis) => {
  const [owner, repo] = analysis.fullName.split('/');
  const url = `${PUBLIC_BASE_URL}/api/badge?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
  badgeUrl = url;
  return `![Repo Health](${url})`;
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
const res = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(parsed) // parsed = { owner, repo }
});



    const r = await res.json();
    if (r.error) throw new Error(r.error);

    // ⬇ reuse your existing metric logic
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
      commits?.nodes?.map(c => c.author?.user?.login).filter(Boolean)
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
        <AlertTriangle class="text-red-500" size={40} />
        Endangered Open Software Monitor
        <AlertTriangle class="text-red-500" size={40} />
      </h1>
            <img src="/mascto2.png" alt="" class="h-48 w-48 block m-auto" style="  transform: scaleX(-1);">
      <p class="text-slate-600 dark:text-slate-400">
        Assess the health and maintenance risk of GitHub repositories.
      </p>
    </div>
<!-- Input Card (enhanced for dark mode) -->
<div
  class="mb-6 rounded-2xl p-[1px]
         bg-gradient-to-r from-slate-200/70 to-slate-300/70
         dark:from-red-500/40 dark:via-fuchsia-500/20 dark:to-slate-500/20
         shadow-lg"
>
  <div
    class="rounded-2xl p-4 sm:p-6
           bg-white/80 dark:bg-slate-950/70
           backdrop-blur
           border border-slate-200/70 dark:border-slate-800/70"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <!-- Search input with icon -->
      <div class="relative flex-1">
        <Search
          size={18}
          class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />

        <input
          type="text"
          bind:value={repoUrl}
          placeholder="https://github.com/owner/repo"
          class="w-full rounded-xl pl-11 pr-4 py-3
                 bg-white/90 dark:bg-slate-950
                 border border-slate-300/80 dark:border-slate-700/80
                 text-slate-900 dark:text-slate-100
                 placeholder-slate-400 dark:placeholder-slate-500
                 shadow-sm dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]
                 focus:outline-none
                 focus:ring-2 focus:ring-red-500/60
                 focus:border-red-500/60
                 dark:focus:ring-red-400/50
                 transition"
          on:keydown={(e) => e.key === 'Enter' && analyzeRepository()}
        />
      </div>

      <button
        on:click={analyzeRepository}
        disabled={loading}
        class="rounded-xl px-6 py-3 font-semibold
               text-white
               bg-red-500 hover:bg-red-600
               shadow-md shadow-red-500/20
               dark:shadow-red-500/25
               disabled:bg-red-200 disabled:text-red-900/60 disabled:shadow-none disabled:cursor-not-allowed
               transition"
      >
        {loading ? 'Monitoring' : 'Monitor'}
      </button>
    </div>

    {#if error}
      <div
        class="mt-4 flex gap-3 rounded-xl p-4
               bg-red-50/80 dark:bg-red-950/60
               border border-red-200/70 dark:border-red-900/70"
      >
        <AlertCircle class="text-red-500" size={20} />
        <p class="text-red-700 dark:text-red-200">{error}</p>
      </div>
    {/if}
  </div>
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

<!-- OpenAlex Mentions -->
<!-- OpenAlex Mentions -->
<div class="rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg mt-6">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
        OpenAlex Mentions (papers per year)
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Showing last <span class="font-semibold">{yearsBack}</span> years (you can change this).
      </p>
    </div>

    <div class="flex items-center gap-3">
      <!-- Years control -->
      <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        Years back
        <input
          type="range"
          min="5"
          max="50"
          step="1"
          bind:value={yearsBack}
          class="w-32 accent-red-500"
        />
        <span class="w-10 text-right font-mono text-slate-700 dark:text-slate-200">{yearsBack}</span>
      </label>

      <button
        class="px-3 py-1.5 rounded-lg text-sm font-semibold
               bg-slate-100 hover:bg-slate-200 text-slate-800
               dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100
               transition disabled:opacity-60"
        on:click={fetchOpenAlexMentions}
        disabled={openAlexLoading}
        title="Re-check OpenAlex"
      >
        {openAlexLoading ? 'Checking…' : 'Refresh'}
      </button>
    </div>
  </div>

  {#if openAlexError}
    <p class="mt-3 text-sm text-red-600 dark:text-red-300">{openAlexError}</p>
  {:else if openAlexLoading}
    <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">Querying OpenAlex…</p>
  {:else if openAlex}
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
      <div>
        Total matched works:
        <span class="font-semibold text-slate-800 dark:text-slate-100">{openAlex.total}</span>
      </div>
      <div class="opacity-70">
        query: <span class="font-mono">{openAlex.query_used}</span>
      </div>
    </div>

    {#if openAlexFiltered?.length}
      <div class="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4">
        <!-- Chart -->
        <div class="flex items-end gap-2 h-44 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {#each openAlexFiltered as d (d.year)}
            <div class="group relative flex flex-col items-center min-w-[34px]">
              <!-- Tooltip -->
              <div
                class="pointer-events-none absolute -top-9 opacity-0 group-hover:opacity-100 transition
                       text-xs px-2 py-1 rounded-md
                       bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow"
              >
                {d.year}: {d.count}
              </div>

              <!-- Animated bar -->
              <div
                class="w-7 rounded-t-lg
                       bg-gradient-to-t from-red-600/70 to-red-400/90
                       shadow-sm shadow-red-500/20
                       transition-all duration-700 ease-out
                       group-hover:brightness-110"
                style={`height:${Math.round((d.count / maxCount) * 150)}px`}
              />

              <!-- Year label -->
              <div class="mt-2 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {d.year}
              </div>
            </div>
          {/each}
        </div>

        <!-- Little legend / hint -->
        <div class="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
          <span>Hover a bar for counts</span>
          <span>Max in view: {maxCount}</span>
        </div>
      </div>
    {:else}
      <p class="mt-4 text-sm text-slate-600 dark:text-slate-400">
        No matches in the last {yearsBack} years. Try increasing “Years back” or hit Refresh.
      </p>
    {/if}

    <p class="mt-4 text-xs text-slate-500 dark:text-slate-500">
      Note: OpenAlex search is fuzzy; this panel tries the GitHub URL first, then falls back to repo name/owner.
    </p>
  {/if}
</div>



      </div>
    {/if}
  </div>
</div>

<Footer/>
