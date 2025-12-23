<script>
  import { Info, GitPullRequest, Beaker, List } from 'lucide-svelte';
</script>

<header class="w-full bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-700">
  <div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">

   

    <!-- Site / Page title -->
    <h1 class="text-lg font-semibold tracking-tight sm:text-xl text-slate-800 dark:text-slate-100">
      <b class="text-red-600">The Red List</b> of Endangered Open Software <i class="text-sm text-slate-500 dark:text-slate-400">v0.1</i>
    </h1>
    

    <!-- Navigation -->
    <nav class="flex items-center gap-6">
      <a
        href="/about"
        class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <Info size={16} />
        <span class="hidden sm:inline">About</span>
      </a>


      <a
        href="https://github.com/natesheehan"
        class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <GitPullRequest size={16} />
        <span class="hidden sm:inline">Contribute</span>
      </a>
            <a
        href="/list"
        class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <List size={16} style="color:red" />
        <span class="hidden sm:inline text-red-600">List</span>
      </a>

            <a
        href="/"
        class="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <Beaker size={16} />
        <span class="hidden sm:inline">Monitor</span>
      </a>
    </nav>

  </div>
</header>
