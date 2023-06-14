<script>
  import '../app.css';
  import WalletProvider from '../lib/modules/wallet/wallet-provider.svelte';
</script>

<WalletProvider>
  <slot />
</WalletProvider>
