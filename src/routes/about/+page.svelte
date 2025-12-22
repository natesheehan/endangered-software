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
        <i>What is Endangered Open Software?</i>
      </h1>

      <img
        src="/mascto2.png"
        alt=""
        class="h-48 w-48 block m-auto"
        style="transform: scaleX(-1);"
      >

      <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
        Endangered open software refers to open-source and openly distributed software projects whose continued development, maintenance, or availability is at risk, despite their ongoing use and significance. These risks are rarely the result of a single failure. More often, they emerge from the accumulation of mundane pressures such as limited maintainer time, unstable funding, technical debt, dependency fragility, and declining contributor communities. Over time, these ordinary conditions can undermine the sustainability of software that remains deeply embedded in research, industry, and public infrastructure. 
 
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
    <section id="why" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 border-dashed dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Why does this project exist?</h2>

<p class="text-slate-700 dark:text-slate-300 mb-3">
  Agh, yikes! Not another open software health tool!? That reaction is understandable. We have seen a steady stream of repository “health” projects come and go, including experiments like
  <a href="https://github.com/dogweather/repo-health-check" class="underline underline-offset-4" target="_blank" rel="noopener noreferrer">repo-health-check</a>,
  <a href="https://github.com/openedx/edx-repo-health" class="underline underline-offset-4" target="_blank" rel="noopener noreferrer">edx-repo-health</a>, and
  <a href="https://repohealth.info/" class="underline underline-offset-4" target="_blank" rel="noopener noreferrer">repohealth.info</a>.
  Many of these efforts were thoughtful and technically sound, yet they now sit largely unmaintained, themselves becoming examples of the fragility they were designed to diagnose.
</p>

<p class="text-slate-700 dark:text-slate-300 mb-3">
  Alongside these are a growing number of commercial analytics products, such as
  <a href="https://graphite.com/guides/guide-to-github-repo-analytics" class="underline underline-offset-4" target="_blank" rel="noopener noreferrer">Graphite’s repository analytics</a>,
  which offer polished insights into development workflows and team productivity. These tools are effective for managing active engineering teams, but they are typically scoped to GitHub, tuned to short-term activity, and oriented toward optimisation rather than long-term sustainability.
</p>

<p class="text-slate-700 dark:text-slate-300">
  This project starts from the observation that open software usually fails slowly and quietly. Maintenance burdens accumulate, governance structures thin out, dependencies harden, and platforms or institutions shift beneath a project’s feet. In response, the Red List of Endangered Software focuses on long-term development trajectories rather than momentary signals. It broadens the range of measurements across multiple platforms and software ecosystems, and treats open software as infrastructure that must be stewarded over time. The aim is not to produce another dashboard of activity metrics, but to make visible the conditions under which open software becomes endangered.
</p>

    </section>

    <section id="what" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2"> What does the Red List of Endangered Software do?</h2>
      <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
                     This tool analyses the <strong>health and sustainability of open-source
        GitHub repositories</strong>. It collects a small but meaningful set of
        signals from the GitHub GraphQL API and combines them into a single,
        interpretable health score.
      </p>

    </section>

    <section id="how" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">How does it work?</h2>
      <p class="text-slate-700 dark:text-slate-300 mb-3">
        Currently the tool focuses on a small number of interpretable signals such as:
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
            <p class="text-slate-700 dark:text-slate-300 mb-2">
        The health score starts at <strong>100</strong> and is reduced based on risk factors such as long periods of inactivity, high ratios of open issues, or a lack of recent contributors.
      </p>

      <p class="text-slate-700 dark:text-slate-300">
        The resulting score is mapped to conservation-style categories such as <em>Least Concern</em>, <em>Endangered</em>, and <em>Extinct</em>.
      </p>

    </section>

    <section id="who" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Who is developing it?</h2>
      <p class="text-slate-700 dark:text-slate-300">
          Endangered open software is currently developed by Nathanael Sheehan. 
      </p>
    </section>

    <section id="when" class="rounded-lg p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">When will a full list be published?</h2>
      <p class="text-slate-700 dark:text-slate-300">
        2026.
      </p>

    </section>

  </main>
</div>

<Footer />
