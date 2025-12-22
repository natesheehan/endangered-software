<script>
  import { Github, Mail, Globe } from 'lucide-svelte';
</script>

<footer class="border-t border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700">
  <div class="mx-auto max-w-7xl px-4 py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

    <!-- Left -->
    <p class="text-sm text-gray-500 dark:text-slate-400 text-center sm:text-left">
      🄯 {new Date().getFullYear()} Endangered Software
    </p>

    <!-- Right -->
    <div class="flex items-center justify-center gap-5">
      <a
        href="https://github.com/natesheehan"
        aria-label="GitHub"
        class="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <Github size={18} />
      </a>

      <a
        href="mailto:nathanaelsheehan@gmail.com"
        aria-label="Email"
        class="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <Mail size={18} />
      </a>

      <a
        href="https://https://nsheehan.vercel.app"
        aria-label="Website"
        class="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition"
      >
        <Globe size={18} />
      </a>
    </div>
  </div>
</footer>
