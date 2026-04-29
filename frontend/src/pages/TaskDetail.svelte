<script lang="ts">
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { push } from 'svelte-spa-router';

  let { params }: { params: { slug: string } } = $props();

  type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

  let loadState: LoadState = $state('loading');
  let html = $state('');

  onMount(async () => {
    try {
      const res = await fetch(`/content/tasks/${params.slug}.md`);
      if (!res.ok) {
        loadState = 'not-found';
        return;
      }
      const text = await res.text();
      html = await marked(text);
      loadState = 'ready';
    } catch {
      loadState = 'error';
    }
  });
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-2xl mx-auto px-4 py-6">
    <button
      onclick={() => push('/')}
      class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      aria-label="Back to checklist"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>

    {#if loadState === 'loading'}
      <div class="flex items-center justify-center py-16 text-gray-400 text-sm">
        Loading…
      </div>
    {:else if loadState === 'not-found'}
      <div class="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
        <p class="text-sm">Content not available for this task.</p>
      </div>
    {:else if loadState === 'error'}
      <div class="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
        <p class="text-sm">Failed to load content. Please try again.</p>
      </div>
    {:else}
      <article class="prose prose-gray max-w-none">
        {@html html}
      </article>
    {/if}
  </div>
</div>
