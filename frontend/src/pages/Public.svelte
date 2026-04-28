<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { api } from '../lib/api';
  import { ws } from '../lib/websocket';
  import { teamsStore } from '../lib/stores.svelte';
  import TeamCard from '../components/TeamCard.svelte';

  onMount(async () => {
    teamsStore.setLoading(true);
    teamsStore.setError(null);
    try {
      const data = await api.teams.list();
      teamsStore.setTeams(data);
    } catch (err) {
      teamsStore.setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      teamsStore.setLoading(false);
    }

    ws.on('task:toggled', handleTaskToggled);
    ws.connect();
  });

  onDestroy(() => {
    ws.off('task:toggled', handleTaskToggled);
  });

  function handleTaskToggled(payload: Record<string, unknown>) {
    const taskId = payload.taskId as string;
    const completed = payload.completed as boolean;
    teamsStore.toggleTask(taskId, completed);
  }

  function onToggle(taskId: string, completed: boolean) {
    teamsStore.toggleTask(taskId, completed);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-blue-600 shadow-sm">
    <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
      <h1 class="text-white text-xl font-bold">RVVR Checklist</h1>
      <a href="#/admin" class="text-blue-200 text-sm hover:text-white transition-colors">Admin</a>
    </div>
  </header>

  <main class="max-w-3xl mx-auto px-4 py-6">
    {#if teamsStore.loading}
      <div class="flex justify-center py-16">
        <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if teamsStore.error}
      <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
        {teamsStore.error}
      </div>
    {:else if teamsStore.teams.length === 0}
      <div class="text-center py-16 text-gray-400">
        <p class="text-lg">No teams configured yet.</p>
        <p class="text-sm mt-1">Ask your admin to set up teams.</p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each teamsStore.teams as team (team.id)}
          <TeamCard {team} {onToggle} />
        {/each}
      </div>
    {/if}
  </main>
</div>
