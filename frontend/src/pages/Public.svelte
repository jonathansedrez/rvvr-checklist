<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { push } from "svelte-spa-router";
  import { api } from "../lib/api";
  import { ws } from "../lib/websocket";
  import { teamsStore } from "../lib/stores.svelte";
  import SectionCard from "../components/SectionCard.svelte";
  import type { Section } from "../lib/types";

  const SECTION_COLORS = ["#6a94c4", "#c4954a", "#4a9e72"];
  const ALL_TAB_ID = "__all__";

  type ViewSection = { section: Section; color: string; label: string };

  let currentTeamId = $state<string | null>(null);
  let openSectionIds = $state<Set<string>>(new Set());

  let currentTeam = $derived(
    teamsStore.teams.find((t) => t.id === currentTeamId) ?? null,
  );

  let headerName = $derived(
    currentTeamId === ALL_TAB_ID ? "Todos" : (currentTeam?.name ?? "—"),
  );

  let viewSections = $derived.by((): ViewSection[] => {
    if (currentTeamId === ALL_TAB_ID) {
      const merged = new Map<string, Section>();
      for (const team of teamsStore.teams) {
        for (const section of team.sections) {
          const existing = merged.get(section.name);
          if (existing) {
            merged.set(section.name, {
              ...existing,
              tasks: [...existing.tasks, ...section.tasks],
            });
          } else {
            merged.set(section.name, { ...section });
          }
        }
      }
      return Array.from(merged.values()).map((section, idx) => ({
        section,
        color: SECTION_COLORS[idx % SECTION_COLORS.length],
        label: section.name,
      }));
    }
    if (!currentTeam) return [];
    return currentTeam.sections.map((section, idx) => ({
      section,
      color: SECTION_COLORS[idx % SECTION_COLORS.length],
      label: section.name,
    }));
  });

  let progress = $derived.by(() => {
    const tasks =
      currentTeamId === ALL_TAB_ID
        ? teamsStore.teams.flatMap((t) => t.sections.flatMap((s) => s.tasks))
        : (currentTeam?.sections.flatMap((s) => s.tasks) ?? []);
    const done = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  });

  onMount(async () => {
    teamsStore.setLoading(true);
    teamsStore.setError(null);
    try {
      const data = await api.teams.list();
      teamsStore.setTeams(data);
      if (data.length > 0) {
        currentTeamId = data[0].id;
        openSectionIds = new Set(data[0].sections.slice(0, 2).map((s) => s.id));
      }
    } catch (err) {
      teamsStore.setError(
        err instanceof Error ? err.message : "Failed to load teams",
      );
    } finally {
      teamsStore.setLoading(false);
    }

    ws.on("task:toggled", handleTaskToggled);
    ws.connect();
  });

  onDestroy(() => {
    ws.off("task:toggled", handleTaskToggled);
  });

  function handleTaskToggled(payload: Record<string, unknown>) {
    const taskId = payload.taskId as string;
    const completed = payload.completed as boolean;
    teamsStore.toggleTask(taskId, completed);
  }

  function selectTeam(teamId: string) {
    currentTeamId = teamId;
    if (teamId === ALL_TAB_ID) {
      // open first merged section by default
      const firstId = teamsStore.teams[0]?.sections[0]?.id;
      openSectionIds = firstId ? new Set([firstId]) : new Set();
    } else {
      const team = teamsStore.teams.find((t) => t.id === teamId);
      if (team) {
        openSectionIds = new Set(team.sections.slice(0, 2).map((s) => s.id));
      }
    }
  }

  function toggleSection(sectionId: string) {
    const next = new Set(openSectionIds);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    openSectionIds = next;
  }

  function onToggleTask(taskId: string, completed: boolean) {
    teamsStore.toggleTask(taskId, completed);
  }
</script>

<div class="page">
  <header>
    <div class="header-top">
      <div class="brand">RVVR</div>
      <div class="header-right">
        <div class="live">
          <div class="live-dot"></div>
          Ao vivo
        </div>
        <button
          class="admin-btn"
          onclick={() => push("/admin")}
          aria-label="Admin"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="header-team-name">{headerName}</div>
    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill" style="width:{progress.pct}%"></div>
      </div>
      <div class="progress-label">
        <span>{progress.done} de {progress.total} concluídas</span>
        <span>{progress.pct}%</span>
      </div>
    </div>
  </header>

  <div class="tabs">
    {#each teamsStore.teams as team (team.id)}
      <button
        class="tab"
        class:active={team.id === currentTeamId}
        onclick={() => selectTeam(team.id)}
      >
        {team.name}
      </button>
    {/each}
    <button
      class="tab"
      class:active={currentTeamId === ALL_TAB_ID}
      onclick={() => selectTeam(ALL_TAB_ID)}
    >
      Todos
    </button>
  </div>

  <div class="sections">
    {#if teamsStore.loading}
      <div class="state-msg">Carregando...</div>
    {:else if teamsStore.error}
      <div class="state-error">{teamsStore.error}</div>
    {:else if viewSections.length === 0}
      <div class="state-msg">Nenhuma seção configurada.</div>
    {:else}
      {#each viewSections as { section, color, label } (section.id)}
        <SectionCard
          {section}
          {color}
          {label}
          isOpen={openSectionIds.has(section.id)}
          onToggleSection={() => toggleSection(section.id)}
          {onToggleTask}
        />
      {/each}
    {/if}
  </div>
</div>

<style>
  .page {
    font-family: "DM Sans", sans-serif;
    background: var(--bg);
    color: var(--text);
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    padding: 52px 24px 0;
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
    gap: 10px;
  }

  .admin-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--text-light);
    transition: color 0.15s;
  }

  .admin-btn:hover {
    color: var(--text-muted);
  }

  .admin-btn svg {
    width: 16px;
    height: 16px;
  }

  .live {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--green);
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .live-dot {
    width: 5px;
    height: 5px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse 2.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.25;
    }
  }

  .header-team-name {
    font-size: 26px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 20px;
  }

  .progress-wrap {
    margin-bottom: 6px;
  }

  .progress-bar {
    height: 2px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: var(--green);
    border-radius: 2px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  .tabs {
    display: flex;
    gap: 6px;
    padding: 20px 24px 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }

  .tab {
    flex-shrink: 0;
    padding: 5px 14px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .tab.active {
    background: var(--text);
    border-color: var(--text);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }

  .sections {
    flex: 1;
    padding: 16px 24px 48px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }

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
