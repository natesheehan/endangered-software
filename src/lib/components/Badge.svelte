<script>
    // Badge variable
let badgeMarkdown = '';
let badgeUrl = '';

// Generate Shields.io badge URL and Markdown
const PUBLIC_BASE_URL = 'https://endangered-software.vercel.app'; // <-- your deployed domain

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
</script>
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