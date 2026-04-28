<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { api } from '../lib/api';
  import { authStore } from '../lib/stores.svelte';

  let email = $state('');
  let password = $state('');
  let error = $state<string | null>(null);
  let loading = $state(false);

  if (authStore.isAuthenticated) {
    push('/admin');
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    loading = true;
    try {
      const result = await api.auth.login(email, password);
      authStore.login(result.token, result.user);
      push('/admin');
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-gray-900">Admin Login</h1>
        <p class="text-gray-500 text-sm mt-1">RVVR Checklist</p>
      </div>

      {#if error}
        <div class="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-sm">
          {error}
        </div>
      {/if}

      <form onsubmit={submit} class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            autocomplete="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="admin@example.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div class="mt-4 text-center">
        <a href="#/" class="text-sm text-gray-500 hover:text-gray-700">Back to checklist</a>
      </div>
    </div>
  </div>
</div>
