import { get, writable } from 'svelte/store';

import { getLocalStorage, setLocalStorage } from './local-storage';
import { WalletConnectionStatus, type WalletStore } from './wallet.type';
import {
  getInitialAdapters,
  getWallets,
  select,
  disconnect,
  getAccounts,
  signTransactionBlock,
  removeAdapterEventListeners,
  addAdapterEventListeners
} from './wallet-utils';

export const wallet$ = createWalletStore();

function createWalletStore() {
  const initialAdapters = getInitialAdapters();
  const initialWallets = getWallets(initialAdapters);

  const { subscribe, update } = writable<WalletStore>({
    adapters: initialAdapters,
    wallets: initialWallets,

    wallet: null,
    storageKey: 'preferredSuiWallet',

    status: WalletConnectionStatus.DISCONNECTED,
    connecting: false,
    connected: false,
    isError: false,

    select,
    disconnect,
    getAccounts,
    signTransactionBlock,

    initialize,
    adapterListeners: []
  });

  async function initialize({ autoConnect = true }) {
    const { connecting, connected, wallet, storageKey, adapters, status } =
      get(wallet$);

    // Clear out any existing event listeners
    removeAdapterEventListeners();

    // Set local storage
    if (connected && wallet) {
      setLocalStorage(storageKey, wallet.name);
    }

    // Auto-connect wallet
    if (!wallet && !connected && !connecting && autoConnect) {
      const preferredWalletName = getLocalStorage(storageKey);

      if (!!preferredWalletName && typeof preferredWalletName === 'string') {
        await select(preferredWalletName);
        // @NOTE Temporary measure. Works with Sui & Suiet wallets, but not Ethos
        // await select('Sui Wallet');
      }
    }

    // Add event listeners
    addAdapterEventListeners(adapters);

    // Update wallet state
    wallet$.update((walletStore) => ({
      ...walletStore,
      connected: status === WalletConnectionStatus.CONNECTED,
      connecting: status === WalletConnectionStatus.CONNECTING,
      isError: status === WalletConnectionStatus.ERROR
    }));
  }

  return {
    subscribe,
    update,
    initialize
  };
}
