<script>
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
</script>

<Header />

<div
  class="min-h-screen bg-gradient-to-br
         from-slate-50 to-slate-100
         dark:from-slate-950 dark:to-slate-900
         p-4 sm:p-8"
>
  <main class="mx-auto max-w-5xl space-y-12">
    <!-- Intro Card -->
    <section
      class="rounded-lg p-6 bg-white dark:bg-slate-900
             border border-slate-200 dark:border-slate-800
             shadow-lg"
    >
      <h1 class="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        <i>What is Open Endangered Software?</i>
      </h1>

      <img
        src="/mascto2.png"
        alt=""
        class="h-48 w-48 block m-auto"
        style="transform: scaleX(-1);"
      >

      <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
        This tool analyses the <strong>health and sustainability of open-source
        GitHub repositories</strong>. It collects a small but meaningful set of
        signals from the GitHub GraphQL API and combines them into a single,
        interpretable health score.
      </p>
    </section>

    <!-- Jump Navigation -->
    <nav
      class="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur
             border-y border-gray-200 dark:border-slate-700 py-3 px-4 rounded-lg shadow-sm"
    >
      <ul class="flex flex-wrap gap-4 text-sm font-medium text-gray-600 dark:text-slate-400">
<li>
  <a href="#why" class="hover:text-gray-900 dark:hover:text-slate-100 transition">
    Why does this project exist?
  </a>
</li>

<li>
  <a href="#what" class="hover:text-gray-900 dark:hover:text-slate-100 transition">
    What does the Red List of Endangered Software do?
  </a>
</li>

<li>
  <a href="#how" class="hover:text-gray-900 dark:hover:text-slate-100 transition">
    How does it work?
  </a>
</li>

<li>
  <a href="#who" class="hover:text-gray-900 dark:hover:text-slate-100 transition">
    Who is developing it?
  </a>
</li>

<li>
  <a href="#when" class="hover:text-gray-900 dark:hover:text-slate-100 transition">
    When will a full list be published?
  </a>
</li>


      </ul>
    </nav>

    <!-- Sections as Cards -->
    <section id="state" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">State & User Input</h2>
      <p class="text-slate-700 dark:text-slate-300 mb-3">The analysis begins with a small set of reactive state variables:</p>
      <ul class="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
        <li><code class="font-mono">repoUrl</code> — the GitHub repository URL provided by the user</li>
        <li><code class="font-mono">loading</code> — whether an analysis request is in progress</li>
        <li><code class="font-mono">analysis</code> — the computed metrics and health score</li>
        <li><code class="font-mono">error</code> — validation or API errors surfaced to the UI</li>
      </ul>
      <p class="text-slate-700 dark:text-slate-300 mt-3">
        This separation allows the UI to respond immediately to user actions
        (loading states, errors, results) without unnecessary re-fetching.
      </p>
    </section>

    <section id="parsing" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Parsing the GitHub URL</h2>
      <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
        Before making any API calls, the repository URL is validated and parsed.
        A simple regular expression extracts the repository owner and name.
      </p>
      <p class="text-slate-700 dark:text-slate-300 mt-2">
        This step prevents unnecessary API requests and ensures that only valid
        GitHub repositories are analysed.
      </p>
    </section>

    <section id="metrics" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Repository Metrics</h2>
      <p class="text-slate-700 dark:text-slate-300 mb-3">
        The tool focuses on a small number of interpretable signals rather than
        opaque machine-learning models. These include:
      </p>
      <ul class="list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
        <li><strong>Activity</strong> — days since last update, commits in the past year</li>
        <li><strong>Maintenance</strong> — open vs closed issues and average issue age</li>
        <li><strong>Community</strong> — number of recent contributors</li>
        <li><strong>Popularity</strong> — stars and forks (contextual, not dominant)</li>
      </ul>
      <p class="text-slate-700 dark:text-slate-300 mt-3">
        Each metric reflects a different dimension of software sustainability: technical upkeep, responsiveness, and social resilience.
      </p>
    </section>

    <section id="scoring" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Health Scoring Model</h2>
      <p class="text-slate-700 dark:text-slate-300 mb-2">
        The health score starts at <strong>100</strong> and is reduced based on risk factors such as long periods of inactivity, high ratios of open issues, or a lack of recent contributors.
      </p>
      <p class="text-slate-700 dark:text-slate-300 mb-2">
        Rather than claiming precision, the score is intended as a <strong>comparative heuristic</strong> — a way to quickly identify projects that may require attention or support.
      </p>
      <p class="text-slate-700 dark:text-slate-300">
        The resulting score is mapped to conservation-style categories such as <em>Least Concern</em>, <em>Endangered</em>, and <em>Extinct</em>.
      </p>
    </section>

    <section id="graphql" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Why GraphQL?</h2>
      <p class="text-slate-700 dark:text-slate-300">
        All repository data is retrieved using a <strong>single GitHub GraphQL query</strong>. This avoids REST rate-limit issues and ensures that only the required fields are fetched.
      </p>
      <p class="text-slate-700 dark:text-slate-300 mt-2">
        Using GraphQL also makes the analysis more reproducible: the entire data surface used by the model is explicit and auditable in one query.
      </p>
    </section>

    <section id="analysis" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">End-to-End Analysis Flow</h2>
      <ol class="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300">
        <li>User submits a GitHub repository URL</li>
        <li>The URL is parsed and validated</li>
        <li>A single GraphQL request retrieves repository data</li>
        <li>Metrics are computed client-side</li>
        <li>A health score and status label are generated</li>
        <li>The results are rendered in the interface</li>
      </ol>
      <p class="text-slate-700 dark:text-slate-300 mt-2">
        This approach keeps the system lightweight, transparent, and easy to extend with additional metrics in future iterations.
      </p>
    </section>
  </main>
</div>

<Footer />
