<script lang="ts">
  import Router from 'svelte-spa-router';
  import Public from './pages/Public.svelte';
  import AdminLogin from './pages/AdminLogin.svelte';
  import Admin from './pages/Admin.svelte';

  const routes = {
    '/': Public,
    '/admin/login': AdminLogin,
    '/admin': Admin,
  };
</script>

<Router {routes} />
