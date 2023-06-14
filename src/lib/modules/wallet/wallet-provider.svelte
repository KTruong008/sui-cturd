<script lang="ts">
  import { onMount } from 'svelte';
  import { initialize } from './wallet';

  // export let localStorageKey: string;
  // export let wallets: Adapter[];
  // export let autoConnect = false;

  onMount(() => {
    initialize();
  });
</script>

<svelte:head>
  <script>
    window.global = window;
  </script>
</svelte:head>
