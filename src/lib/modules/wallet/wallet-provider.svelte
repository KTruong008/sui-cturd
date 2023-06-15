<script lang="ts">
  import { onMount } from 'svelte';
  import { initialize } from './wallet-utils';

  export let autoConnect = true;
  // export let localStorageKey = 'preferredSuiWallet';
  // export let wallets: Adapter[];

  onMount(() => {
    initialize({
      autoConnect
      // wallets,
    });
  });
</script>

<svelte:head>
  <script>
    window.global = window;
  </script>
</svelte:head>
