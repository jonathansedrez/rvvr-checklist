<script lang="ts">
  import { onMount } from "svelte";
  import { marked } from "marked";
  import { push } from "svelte-spa-router";

  let { params }: { params: { slug: string } } = $props();

  type LoadState = "loading" | "ready" | "not-found" | "error";

  let loadState: LoadState = $state("loading");
  let html = $state("");

  onMount(async () => {
    try {
      const res = await fetch(`/content/tasks/${params.slug}.md`);
      if (!res.ok) {
        loadState = "not-found";
        return;
      }
      const text = await res.text();
      html = await marked(text);
      loadState = "ready";
    } catch {
      loadState = "error";
    }
  });
</script>

<div class="page">
  <div class="inner">
    <button class="back" onclick={() => push("/")} aria-label="Voltar">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 19l-7-7 7-7" />
      </svg>
      Voltar
    </button>

    {#if loadState === "loading"}
      <div class="state-msg">Carregando…</div>
    {:else if loadState === "not-found"}
      <div class="state-msg">Conteúdo não disponível para esta tarefa.</div>
    {:else if loadState === "error"}
      <div class="state-msg">Falha ao carregar. Tente novamente.</div>
    {:else}
      <article class="prose prose-gray max-w-none">
        {@html html}
      </article>
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
  }

  .inner {
    padding: 52px 24px 48px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: "DM Sans", sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-bottom: 28px;
    transition: color 0.15s;
  }

  .back:hover {
    color: var(--text);
  }

  .back svg {
    width: 16px;
    height: 16px;
  }

  .state-msg {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    padding: 48px 0;
  }
</style>
