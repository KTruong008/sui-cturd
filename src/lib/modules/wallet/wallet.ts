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
    localStorageKey: 'preferredSuiWallet',

    status: WalletConnectionStatus.DISCONNECTED,
    connecting: false,
    connected: false,
    isError: false,

    select,
    disconnect,
    getAccounts,
    signTransactionBlock,

    initializeWallet,
    adapterListeners: []
  });

  async function initializeWallet({ autoConnect = true }) {
    const {
      connecting,
      connected,
      wallets,
      wallet,
      localStorageKey,
      adapters,
      status
    } = get(wallet$);

    // Clear out any existing event listeners
    removeAdapterEventListeners();

    // Select wallet
    if (!wallet && !connected && !connecting) {
      const preferredWallet = getLocalStorage(localStorageKey);

      if (!!preferredWallet && typeof preferredWallet === 'string') {
        await select(preferredWallet);
      } else if (autoConnect) {
        // @NOTE Temporary measure. Works with Sui & Suiet wallets, but not Ethos
        await select('Sui Wallet');
      }
    }

    // Set local storage
    if (connected && wallet) {
      setLocalStorage(localStorageKey, wallet.name);
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
    initializeWallet
  };
}
