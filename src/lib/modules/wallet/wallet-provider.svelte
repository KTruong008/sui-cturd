<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeWallet } from './wallet-utils';

  export let autoConnect = true;
  // export let localStorageKey = 'preferredSuiWallet';
  // export let wallets: Adapter[];

  onMount(() => {
    initializeWallet({
      autoConnect
      // wallets,
    });
  });
</script>
