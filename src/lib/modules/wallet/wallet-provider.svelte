<script lang="ts">
  import { initializeWallet } from './wallet-utils';

  export let autoConnect = true;

  $: initializeWallet({
    autoConnect
  });
</script>
