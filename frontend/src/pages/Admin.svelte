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

<div class="page">
  <header>
    <div class="header-top">
      <div class="brand">RVVR</div>
      <div class="header-right">
        <a href="#/" class="back-link">Ver checklist</a>
        <button onclick={logout} class="logout-btn">Sair</button>
      </div>
    </div>
    <div class="header-title">Admin</div>
    <div class="header-sub">{authStore.user?.email}</div>
  </header>

  <main>
    {#if teamsStore.error}
      <div class="state-error">{teamsStore.error}</div>
    {/if}

    <!-- Create Team -->
    <section class="card">
      <div class="card-header">
        <span class="card-label">Adicionar time</span>
      </div>
      <div class="card-body">
        {#if teamFormError}
          <p class="form-error">{teamFormError}</p>
        {/if}
        <form onsubmit={createTeam} class="form-row">
          <input
            type="text"
            bind:value={newTeamName}
            required
            placeholder="Nome do time"
            class="input"
          />
          <button type="submit" disabled={teamFormLoading} class="btn-primary">
            Adicionar
          </button>
        </form>
      </div>
    </section>

    <!-- Teams list -->
    {#if teamsStore.loading}
      <div class="state-msg">Carregando...</div>
    {:else}
      {#each teamsStore.teams as team (team.id)}
        <section class="card">
          <!-- Team header -->
          <div class="team-header">
            {#if editingTeam?.id === team.id}
              <form onsubmit={saveEditTeam} class="inline-form">
                <input type="text" bind:value={editTeamName} required class="input" />
                <button type="submit" class="btn-link">Salvar</button>
                <button type="button" onclick={() => editingTeam = null} class="btn-link muted">Cancelar</button>
              </form>
            {:else}
              <h2 class="team-name">{team.name}</h2>
              <div class="row-actions">
                <button onclick={() => startEditTeam(team)} class="btn-link">Editar</button>
                <button onclick={() => deleteTeam(team.id)} class="btn-link danger">Excluir</button>
              </div>
            {/if}
          </div>

          <!-- Sections -->
          {#each team.sections as section (section.id)}
            <div class="section-item">
              <div class="section-header">
                {#if editingSection?.id === section.id}
                  <form onsubmit={saveEditSection} class="inline-form">
                    <input type="text" bind:value={editSectionName} required class="input" />
                    <button type="submit" class="btn-link">Salvar</button>
                    <button type="button" onclick={() => editingSection = null} class="btn-link muted">Cancelar</button>
                  </form>
                {:else}
                  <h3 class="section-name">{section.name}</h3>
                  <div class="row-actions">
                    <button onclick={() => startEditSection(section)} class="btn-link">Editar</button>
                    <button onclick={() => deleteSection(section.id)} class="btn-link danger">Excluir</button>
                  </div>
                {/if}
              </div>

              <!-- Tasks -->
              <ul class="tasks-list">
                {#each section.tasks as task (task.id)}
                  <li class="task-item">
                    {#if editingTask?.id === task.id}
                      <form onsubmit={saveEditTask} class="inline-form">
                        <input type="text" bind:value={editTaskTitle} required placeholder="Título" class="input" />
                        <input type="text" bind:value={editTaskSlug} placeholder="Slug (opcional)" class="input input-slug" />
                        <button type="submit" class="btn-link">Salvar</button>
                        <button type="button" onclick={() => editingTask = null} class="btn-link muted">Cancelar</button>
                      </form>
                    {:else}
                      <span class="task-title">{task.title}</span>
                      {#if task.slug}
                        <span class="task-slug">{task.slug}</span>
                      {/if}
                      <div class="row-actions">
                        <button onclick={() => startEditTask(task)} class="btn-link">Editar</button>
                        <button onclick={() => deleteTask(task.id)} class="btn-link danger">Excluir</button>
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>

              <!-- Add task -->
              {#if taskFormSectionId === section.id}
                <form onsubmit={createTask} class="form-row form-row-sm">
                  <input type="text" bind:value={newTaskTitle} required placeholder="Título da tarefa" class="input" />
                  <input type="text" bind:value={newTaskSlug} placeholder="Slug (opcional)" class="input input-slug" />
                  <button type="submit" disabled={taskFormLoading} class="btn-primary btn-sm">Adicionar</button>
                  <button type="button" onclick={() => { taskFormSectionId = null; newTaskTitle = ''; newTaskSlug = ''; }} class="btn-link muted">Cancelar</button>
                </form>
                {#if taskFormError}
                  <p class="form-error">{taskFormError}</p>
                {/if}
              {:else}
                <button
                  onclick={() => { taskFormSectionId = section.id; taskFormError = null; }}
                  class="btn-add"
                >
                  + Adicionar tarefa
                </button>
              {/if}
            </div>
          {/each}

          <!-- Add section -->
          <div class="add-section-footer">
            {#if sectionFormTeamId === team.id}
              <form onsubmit={createSection} class="form-row form-row-sm">
                <input type="text" bind:value={newSectionName} required placeholder="Nome da seção" class="input" />
                <button type="submit" disabled={sectionFormLoading} class="btn-primary btn-sm">Adicionar</button>
                <button type="button" onclick={() => { sectionFormTeamId = null; newSectionName = ''; }} class="btn-link muted">Cancelar</button>
              </form>
              {#if sectionFormError}
                <p class="form-error">{sectionFormError}</p>
              {/if}
            {:else}
              <button
                onclick={() => { sectionFormTeamId = team.id; sectionFormError = null; }}
                class="btn-add"
              >
                + Adicionar seção
              </button>
            {/if}
          </div>
        </section>
      {/each}
    {/if}
  </main>
</div>

<style>
  .page {
    font-family: "DM Sans", sans-serif;
    background: var(--bg);
    color: var(--text);
    max-width: 680px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 52px 24px 0;
    margin-bottom: 24px;
  }

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .brand {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-link {
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.15s;
  }
  .back-link:hover {
    color: var(--text);
  }

  .logout-btn {
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: 1.5px solid var(--border);
    border-radius: 20px;
    padding: 4px 14px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.18s;
  }
  .logout-btn:hover {
    background: var(--text);
    border-color: var(--text);
    color: #fff;
  }

  .header-title {
    font-size: 26px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .header-sub {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 3px;
  }

  main {
    flex: 1;
    padding: 0 24px 48px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Cards ── */

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }

  .card-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }

  .card-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .card-body {
    padding: 16px 20px;
  }

  .team-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
  }

  .team-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
  }

  /* ── Sections ── */

  .section-item {
    padding: 14px 20px;
    border-top: 1px solid var(--border);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .section-name {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
  }

  .add-section-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }

  /* ── Tasks ── */

  .tasks-list {
    list-style: none;
    padding: 0;
    margin: 0 0 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .task-title {
    flex: 1;
    font-size: 13px;
    color: var(--text);
  }

  .task-slug {
    font-size: 11px;
    font-family: monospace;
    color: var(--text-light);
  }

  /* ── Buttons ── */

  .row-actions {
    display: flex;
    gap: 10px;
  }

  .btn-link {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .btn-link:hover {
    color: var(--text);
  }
  .btn-link.danger {
    color: #c9584a;
  }
  .btn-link.danger:hover {
    color: #a0392c;
  }
  .btn-link.muted {
    color: var(--text-light);
  }

  .btn-add {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .btn-add:hover {
    color: var(--text);
  }

  .btn-primary {
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 500;
    background: var(--text);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.15s;
  }
  .btn-primary:hover {
    opacity: 0.85;
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-primary.btn-sm {
    padding: 6px 12px;
  }

  /* ── Forms ── */

  .form-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-row-sm {
    margin-top: 4px;
  }

  .inline-form {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .input {
    flex: 1;
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    padding: 8px 12px;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
    min-width: 0;
  }
  .input:focus {
    border-color: var(--text-muted);
  }
  .input::placeholder {
    color: var(--text-light);
  }

  .input-slug {
    flex: 0 0 140px;
  }

  .form-error {
    font-size: 12px;
    color: #c9584a;
    margin: 6px 0 0;
  }

  /* ── States ── */

  .state-msg {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    padding: 48px 0;
  }

  .state-error {
    background: #fff0f0;
    border: 1px solid #fcc;
    border-radius: 10px;
    padding: 12px 16px;
    color: #c00;
    font-size: 13px;
  }
</style>
