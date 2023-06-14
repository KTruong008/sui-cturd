<script lang="ts">
  import { wallet$ } from '$lib/modules/wallet/wallet';

  let wallet = $wallet$;

  wallet.wallets.forEach((w) => {
    console.log(w.name);
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
