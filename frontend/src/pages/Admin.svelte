<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { api } from '../lib/api';
  import { authStore, teamsStore } from '../lib/stores.svelte';
  import type { Team, Section, Task, TeamRow, SectionRow } from '../lib/types';

  // Auth guard
  if (!authStore.isAuthenticated) {
    push('/admin/login');
  }

  // ── Local state ──────────────────────────────────────────────────────────────

  // Team form
  let newTeamName = $state('');
  let teamFormError = $state<string | null>(null);
  let teamFormLoading = $state(false);
  let editingTeam = $state<Team | null>(null);
  let editTeamName = $state('');

  // Section form
  let newSectionName = $state('');
  let sectionFormTeamId = $state<string | null>(null);
  let sectionFormError = $state<string | null>(null);
  let sectionFormLoading = $state(false);
  let editingSection = $state<Section | null>(null);
  let editSectionName = $state('');

  // Task form
  let newTaskTitle = $state('');
  let newTaskSlug = $state('');
  let taskFormSectionId = $state<string | null>(null);
  let taskFormError = $state<string | null>(null);
  let taskFormLoading = $state(false);
  let editingTask = $state<Task | null>(null);
  let editTaskTitle = $state('');
  let editTaskSlug = $state('');

  // ── Load data ────────────────────────────────────────────────────────────────

  onMount(async () => {
    if (!authStore.isAuthenticated) return;
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
  });

  // ── Teams ────────────────────────────────────────────────────────────────────

  async function createTeam(e: SubmitEvent) {
    e.preventDefault();
    teamFormError = null;
    teamFormLoading = true;
    try {
      const team = await api.teams.create(newTeamName.trim());
      teamsStore.setTeams([...teamsStore.teams, { ...team, sections: [] }]);
      newTeamName = '';
    } catch (err) {
      teamFormError = err instanceof Error ? err.message : 'Failed to create team';
    } finally {
      teamFormLoading = false;
    }
  }

  function startEditTeam(team: Team) {
    editingTeam = team;
    editTeamName = team.name;
  }

  async function saveEditTeam(e: SubmitEvent) {
    e.preventDefault();
    if (!editingTeam) return;
    try {
      const updated = await api.teams.update(editingTeam.id, editTeamName.trim());
      teamsStore.setTeams(teamsStore.teams.map(t =>
        t.id === updated.id ? { ...t, name: updated.name } : t
      ));
      editingTeam = null;
    } catch (err) {
      teamFormError = err instanceof Error ? err.message : 'Failed to update team';
    }
  }

  async function deleteTeam(id: string) {
    if (!confirm('Delete this team and all its sections and tasks?')) return;
    try {
      await api.teams.delete(id);
      teamsStore.setTeams(teamsStore.teams.filter(t => t.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete team');
    }
  }

  // ── Sections ─────────────────────────────────────────────────────────────────

  async function createSection(e: SubmitEvent) {
    e.preventDefault();
    if (!sectionFormTeamId) return;
    sectionFormError = null;
    sectionFormLoading = true;
    try {
      const section = await api.sections.create(sectionFormTeamId, newSectionName.trim());
      teamsStore.setTeams(teamsStore.teams.map(t =>
        t.id === sectionFormTeamId
          ? { ...t, sections: [...t.sections, { ...section, tasks: [] }] }
          : t
      ));
      newSectionName = '';
      sectionFormTeamId = null;
    } catch (err) {
      sectionFormError = err instanceof Error ? err.message : 'Failed to create section';
    } finally {
      sectionFormLoading = false;
    }
  }

  function startEditSection(section: Section) {
    editingSection = section;
    editSectionName = section.name;
  }

  async function saveEditSection(e: SubmitEvent) {
    e.preventDefault();
    if (!editingSection) return;
    try {
      const updated = await api.sections.update(editingSection.id, editSectionName.trim());
      teamsStore.setTeams(teamsStore.teams.map(t => ({
        ...t,
        sections: t.sections.map(s =>
          s.id === updated.id ? { ...s, name: updated.name } : s
        ),
      })));
      editingSection = null;
    } catch (err) {
      sectionFormError = err instanceof Error ? err.message : 'Failed to update section';
    }
  }

  async function deleteSection(id: string) {
    if (!confirm('Delete this section and all its tasks?')) return;
    try {
      await api.sections.delete(id);
      teamsStore.setTeams(teamsStore.teams.map(t => ({
        ...t,
        sections: t.sections.filter(s => s.id !== id),
      })));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete section');
    }
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async function createTask(e: SubmitEvent) {
    e.preventDefault();
    if (!taskFormSectionId) return;
    taskFormError = null;
    taskFormLoading = true;
    try {
      const task = await api.tasks.create(taskFormSectionId, newTaskTitle.trim(), newTaskSlug.trim() || undefined);
      teamsStore.setTeams(teamsStore.teams.map(t => ({
        ...t,
        sections: t.sections.map(s =>
          s.id === taskFormSectionId
            ? { ...s, tasks: [...s.tasks, task] }
            : s
        ),
      })));
      newTaskTitle = '';
      newTaskSlug = '';
      taskFormSectionId = null;
    } catch (err) {
      taskFormError = err instanceof Error ? err.message : 'Failed to create task';
    } finally {
      taskFormLoading = false;
    }
  }

  function startEditTask(task: Task) {
    editingTask = task;
    editTaskTitle = task.title;
    editTaskSlug = task.slug ?? '';
  }

  async function saveEditTask(e: SubmitEvent) {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const updated = await api.tasks.update(editingTask.id, {
        title: editTaskTitle.trim(),
        slug: editTaskSlug.trim() || null,
      });
      teamsStore.setTeams(teamsStore.teams.map(t => ({
        ...t,
        sections: t.sections.map(s => ({
          ...s,
          tasks: s.tasks.map(task => task.id === updated.id ? updated : task),
        })),
      })));
      editingTask = null;
    } catch (err) {
      taskFormError = err instanceof Error ? err.message : 'Failed to update task';
    }
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    try {
      await api.tasks.delete(id);
      teamsStore.setTeams(teamsStore.teams.map(t => ({
        ...t,
        sections: t.sections.map(s => ({
          ...s,
          tasks: s.tasks.filter(task => task.id !== id),
        })),
      })));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }

  function logout() {
    authStore.logout();
    push('/admin/login');
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-blue-600 shadow-sm">
    <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
      <div>
        <h1 class="text-white text-xl font-bold">Admin Dashboard</h1>
        <p class="text-blue-200 text-xs">{authStore.user?.email}</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="#/" class="text-blue-200 text-sm hover:text-white">View Checklist</a>
        <button
          onclick={logout}
          class="bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <!-- Global error -->
    {#if teamsStore.error}
      <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
        {teamsStore.error}
      </div>
    {/if}

    <!-- Create Team -->
    <section class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h2 class="text-base font-semibold text-gray-900 mb-3">Add Team</h2>
      {#if teamFormError}
        <p class="text-red-600 text-sm mb-2">{teamFormError}</p>
      {/if}
      <form onsubmit={createTeam} class="flex gap-2">
        <input
          type="text"
          bind:value={newTeamName}
          required
          placeholder="Team name"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={teamFormLoading}
          class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>
    </section>

    <!-- Teams list -->
    {#if teamsStore.loading}
      <div class="flex justify-center py-10">
        <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else}
      {#each teamsStore.teams as team (team.id)}
        <section class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- Team header -->
          <div class="bg-blue-50 border-b border-blue-100 px-5 py-3 flex items-center justify-between">
            {#if editingTeam?.id === team.id}
              <form onsubmit={saveEditTeam} class="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  bind:value={editTeamName}
                  required
                  class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" class="text-blue-600 text-sm font-medium hover:text-blue-800">Save</button>
                <button type="button" onclick={() => editingTeam = null} class="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
              </form>
            {:else}
              <h2 class="font-semibold text-blue-900">{team.name}</h2>
              <div class="flex gap-2">
                <button onclick={() => startEditTeam(team)} class="text-blue-600 text-xs hover:text-blue-800">Edit</button>
                <button onclick={() => deleteTeam(team.id)} class="text-red-500 text-xs hover:text-red-700">Delete</button>
              </div>
            {/if}
          </div>

          <!-- Sections -->
          <div class="divide-y divide-gray-100">
            {#each team.sections as section (section.id)}
              <div class="px-5 py-3">
                <!-- Section header -->
                <div class="flex items-center justify-between mb-2">
                  {#if editingSection?.id === section.id}
                    <form onsubmit={saveEditSection} class="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        bind:value={editSectionName}
                        required
                        class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button type="submit" class="text-blue-600 text-sm font-medium hover:text-blue-800">Save</button>
                      <button type="button" onclick={() => editingSection = null} class="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
                    </form>
                  {:else}
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-500">{section.name}</h3>
                    <div class="flex gap-2">
                      <button onclick={() => startEditSection(section)} class="text-blue-600 text-xs hover:text-blue-800">Edit</button>
                      <button onclick={() => deleteSection(section.id)} class="text-red-500 text-xs hover:text-red-700">Delete</button>
                    </div>
                  {/if}
                </div>

                <!-- Tasks -->
                <ul class="space-y-1 mb-3">
                  {#each section.tasks as task (task.id)}
                    <li class="flex items-center gap-2 text-sm">
                      {#if editingTask?.id === task.id}
                        <form onsubmit={saveEditTask} class="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            bind:value={editTaskTitle}
                            required
                            placeholder="Title"
                            class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            bind:value={editTaskSlug}
                            placeholder="Slug (optional)"
                            class="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button type="submit" class="text-blue-600 text-sm font-medium hover:text-blue-800">Save</button>
                          <button type="button" onclick={() => editingTask = null} class="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
                        </form>
                      {:else}
                        <span class="flex-1 text-gray-800">{task.title}</span>
                        {#if task.slug}
                          <span class="text-gray-400 text-xs font-mono">{task.slug}</span>
                        {/if}
                        <button onclick={() => startEditTask(task)} class="text-blue-600 text-xs hover:text-blue-800">Edit</button>
                        <button onclick={() => deleteTask(task.id)} class="text-red-500 text-xs hover:text-red-700">Delete</button>
                      {/if}
                    </li>
                  {/each}
                </ul>

                <!-- Add task form -->
                {#if taskFormSectionId === section.id}
                  <form onsubmit={createTask} class="flex gap-2">
                    <input
                      type="text"
                      bind:value={newTaskTitle}
                      required
                      placeholder="Task title"
                      class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      bind:value={newTaskSlug}
                      placeholder="Slug (optional)"
                      class="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={taskFormLoading} class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">Add</button>
                    <button type="button" onclick={() => { taskFormSectionId = null; newTaskTitle = ''; newTaskSlug = ''; }} class="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
                  </form>
                  {#if taskFormError}
                    <p class="text-red-600 text-xs mt-1">{taskFormError}</p>
                  {/if}
                {:else}
                  <button
                    onclick={() => { taskFormSectionId = section.id; taskFormError = null; }}
                    class="text-blue-600 text-xs hover:text-blue-800 font-medium"
                  >
                    + Add task
                  </button>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Add section form -->
          <div class="border-t border-gray-100 px-5 py-3 bg-gray-50">
            {#if sectionFormTeamId === team.id}
              <form onsubmit={createSection} class="flex gap-2">
                <input
                  type="text"
                  bind:value={newSectionName}
                  required
                  placeholder="Section name"
                  class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" disabled={sectionFormLoading} class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">Add</button>
                <button type="button" onclick={() => { sectionFormTeamId = null; newSectionName = ''; }} class="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
              </form>
              {#if sectionFormError}
                <p class="text-red-600 text-xs mt-1">{sectionFormError}</p>
              {/if}
            {:else}
              <button
                onclick={() => { sectionFormTeamId = team.id; sectionFormError = null; }}
                class="text-blue-600 text-xs hover:text-blue-800 font-medium"
              >
                + Add section
              </button>
            {/if}
          </div>
        </section>
      {/each}
    {/if}
  </main>
</div>
