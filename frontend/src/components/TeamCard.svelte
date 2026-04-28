<script lang="ts">
  import type { Team } from '../lib/types';
  import TaskRow from './TaskRow.svelte';

  let { team, onToggle }: { team: Team; onToggle?: (taskId: string, completed: boolean) => void } = $props();
</script>

<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
  <div class="bg-blue-600 px-4 py-3">
    <h2 class="text-white font-semibold text-lg">{team.name}</h2>
  </div>

  {#if team.sections.length === 0}
    <p class="text-gray-400 text-sm text-center py-6">No sections yet.</p>
  {:else}
    {#each team.sections as section (section.id)}
      <div class="border-b border-gray-100 last:border-0">
        <div class="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">{section.name}</h3>
        </div>
        {#if section.tasks.length === 0}
          <p class="text-gray-400 text-xs text-center py-3">No tasks.</p>
        {:else}
          <ul>
            {#each section.tasks as task (task.id)}
              <TaskRow {task} {onToggle} />
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  {/if}
</div>
