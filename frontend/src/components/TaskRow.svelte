<script lang="ts">
  import type { Task } from '../lib/types';
  import { api } from '../lib/api';
  import { push } from 'svelte-spa-router';

  let { task, onToggle }: { task: Task; onToggle?: (taskId: string, completed: boolean) => void } = $props();

  let pending = $state(false);

  async function toggle() {
    if (pending) return;
    pending = true;
    try {
      const updated = await api.tasks.toggle(task.id);
      onToggle?.(updated.id, updated.completed);
    } finally {
      pending = false;
    }
  }

  function openDetail() {
    push(`/task/${task.slug}`);
  }
</script>

<li class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
  <button
    onclick={toggle}
    disabled={pending}
    class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
      {task.completed
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'border-gray-300 hover:border-blue-400'}"
    aria-label="{task.completed ? 'Mark incomplete' : 'Mark complete'}"
  >
    {#if task.completed}
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    {/if}
  </button>

  <span class="flex-1 text-sm {task.completed ? 'line-through text-gray-400' : 'text-gray-800'}">
    {task.title}
  </span>

  {#if pending}
    <span class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
  {/if}

  {#if task.slug}
    <button
      onclick={openDetail}
      class="flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
      aria-label="View details for {task.title}"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      </svg>
    </button>
  {/if}
</li>
