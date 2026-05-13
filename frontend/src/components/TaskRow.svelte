<script lang="ts">
  import type { Task } from "../lib/types";
  import { api } from "../lib/api";
  import { push } from "svelte-spa-router";

  let {
    task,
    onToggle,
  }: { task: Task; onToggle?: (taskId: string, completed: boolean) => void } =
    $props();

  let pending = $state(false);

  async function toggle(e: MouseEvent) {
    e.stopPropagation();
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

<div class="task" class:done={task.completed}>
  <button
    class="chk"
    onclick={toggle}
    disabled={pending}
    aria-label={task.completed
      ? "Marcar como não concluída"
      : "Marcar como concluída"}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </button>
  {#if task.slug}
    <button type="button" class="task-lbl task-lbl--link" onclick={openDetail}>
      {task.title}
    </button>
  {:else}
    <span class="task-lbl">{task.title}</span>
  {/if}
</div>

<style>
  .task {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 13px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.1s;
  }

  .task:last-child {
    border-bottom: none;
  }

  .task:active {
    background: rgba(0, 0, 0, 0.015);
  }

  .chk {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 1.5px solid var(--border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
    background: var(--surface);
    cursor: pointer;
    padding: 0;
  }

  .task.done .chk {
    background: var(--green-check);
    border-color: var(--green-check);
    box-shadow: 0 2px 6px rgba(58, 140, 101, 0.25);
  }

  .chk svg {
    width: 11px;
    height: 11px;
    stroke: white;
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity 0.15s,
      transform 0.15s;
  }

  .task.done .chk svg {
    opacity: 1;
    transform: scale(1);
  }

  .task-lbl {
    font-size: 14px;
    font-weight: 400;
    color: var(--text);
    line-height: 1.35;
    flex: 1;
    transition: color 0.15s;
  }

  .task-lbl--link {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    font-family: inherit;
    cursor: pointer;
  }

  .task.done .task-lbl {
    color: var(--text-light);
    text-decoration: line-through;
    text-decoration-color: var(--text-light);
  }
</style>
