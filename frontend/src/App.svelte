<script lang="ts">
  import Router from 'svelte-spa-router';
  import Public from './pages/Public.svelte';
  import AdminLogin from './pages/AdminLogin.svelte';
  import Admin from './pages/Admin.svelte';
  import TaskDetail from './pages/TaskDetail.svelte';

  const routes = {
    '/': Public,
    '/admin/login': AdminLogin,
    '/admin': Admin,
    '/task/:slug': TaskDetail,
  };
</script>

<Router {routes} />
