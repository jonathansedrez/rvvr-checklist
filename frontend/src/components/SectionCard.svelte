<script lang="ts">
  import type { Section } from "../lib/types";
  import TaskRow from "./TaskRow.svelte";

  let {
    section,
    color,
    isOpen,
    onToggleSection,
    onToggleTask,
  }: {
    section: Section;
    color: string;
    isOpen: boolean;
    onToggleSection: () => void;
    onToggleTask: (taskId: string, completed: boolean) => void;
  } = $props();

  let doneCount = $derived(section.tasks.filter((t) => t.completed).length);
</script>

<div class="section" class:open={isOpen}>
  <button type="button" class="sec-hdr" onclick={onToggleSection}>
    <div class="sec-dot" style="background:{color}"></div>
    <span class="sec-name">{section.name}</span>
    <span class="sec-badge">{doneCount}/{section.tasks.length}</span>
    <svg
      class="sec-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>
  {#if isOpen}
    <div class="tasks">
      {#each section.tasks as task (task.id)}
        <TaskRow {task} onToggle={onToggleTask} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .section {
    background: var(--surface);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: box-shadow 0.25s ease;
    border: 1px solid rgba(0, 0, 0, 0.03);
  }

  .section.open {
    box-shadow: var(--shadow-card-open);
  }

  .sec-hdr {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    width: 100%;
    background: none;
    border: none;
    text-align: left;
    font-family: inherit;
  }

  .section.open .sec-hdr {
    border-bottom: 1px solid var(--border);
  }

  .sec-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    opacity: 0.7;
  }

  .sec-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    flex: 1;
  }

  .sec-badge {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 400;
  }

  .sec-chevron {
    width: 14px;
    height: 14px;
    color: var(--text-light);
    transition: transform 0.22s ease;
    flex-shrink: 0;
  }

  .section.open .sec-chevron {
    transform: rotate(180deg);
  }

  .tasks {
    display: flex;
    flex-direction: column;
  }
</style>
