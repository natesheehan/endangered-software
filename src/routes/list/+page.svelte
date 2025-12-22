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

      <h1 class="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4 text-center">
        <i>COMING SOON</i>
      </h1>

      <img
        src="/mascot3.png"
        alt=""
        class="h-48 w-48 block m-auto"
        style="transform: scaleX(-1);"
      >

<p class="text-slate-700 dark:text-slate-300 leading-relaxed">
  The first complete version of the Red List of Endangered Software is currently in development and is planned for release in 2026. At present, the project is focused on building a robust and reliable monitoring tool that can be applied at scale across a large corpus of open software repositories. Future phases of the work will also examine software ecosystems more broadly, including package managers, social and collaborative networks, and patterns of use in scientific research and industry.
</p>

<p class="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
  If you are interested in contributing to the project, sharing expertise, or collaborating on its development, please visit the <a href="/contribute" class="font-medium underline underline-offset-4">contribute page</a> to find out how to get involved.
</p>

    </section>


  </main>
</div>

<Footer />
