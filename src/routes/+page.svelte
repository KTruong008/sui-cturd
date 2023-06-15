<script lang="ts">
  import { wallet$ } from '$lib/modules/wallet/wallet';

  $: wallet = $wallet$;

  $: {
    console.log('page wallet: ', wallet);
  }
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
