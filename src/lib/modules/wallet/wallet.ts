import { get, writable } from 'svelte/store';
import type { SignedTransaction, TransactionBlock } from '@mysten/sui.js';
import type { WalletAdapterList } from '@mysten/wallet-adapter-base';
import { isWalletProvider, resolveAdapters } from '@mysten/wallet-adapter-base';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';
import { UnsafeBurnerWalletAdapter } from '@mysten/wallet-adapter-unsafe-burner';

import { getLocalStorage, setLocalStorage } from './local-storage';
import { WalletConnectionStatus, type WalletStore } from './wallet.type';

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

  function initializeWallet() {
    const { connecting, connected, wallet, localStorageKey, adapters, status } =
      get(wallet$);

    // Clear out any existing event listeners
    removeAdapterEventListeners();

    // Select wallet
    if (!wallet && !connected && !connecting) {
      const preferredWallet = getLocalStorage(localStorageKey);
      if (typeof preferredWallet === 'string') {
        select(preferredWallet);
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

export async function initialize() {
  wallet$.initializeWallet();
}

/**
 * Event listeners for adapters
 */
function addAdapterEventListeners(walletAdapterList: WalletAdapterList) {
  const walletProviders = walletAdapterList.filter(isWalletProvider);
  if (!walletProviders.length) return;

  const adapterListeners = walletProviders.map((walletProvider) =>
    walletProvider.on('changed', () => {
      wallet$.update((walletStore) => ({
        ...walletStore,
        wallets: resolveAdapters(walletAdapterList)
      }));
    })
  );

  wallet$.update((walletStore) => ({
    ...walletStore,
    wallets: resolveAdapters(walletAdapterList),
    adapterListeners
  }));
}

function removeAdapterEventListeners() {
  const { adapterListeners } = get(wallet$);

  adapterListeners.forEach((unlisten) => {
    // Adapater-specific method returned from 'changed' event listener
    unlisten();
  });
}

/**
 * Select wallet
 */
async function select(walletName: string) {
  const { wallets } = get(wallet$);
  const selectedWallet = wallets.find((wallet) => wallet?.name === walletName) ?? null;

  wallet$.update((walletStore) => ({
    ...walletStore,
    wallet: selectedWallet
  }));

  if (selectedWallet && !selectedWallet.connecting) {
    try {
      wallet$.update((walletStore) => ({
        ...walletStore,
        status: WalletConnectionStatus.CONNECTING
      }));
      await selectedWallet.connect();
      wallet$.update((walletStore) => ({
        ...walletStore,
        status: WalletConnectionStatus.CONNECTED
      }));
    } catch (error) {
      console.log('Wallet connection error', error);
      wallet$.update((walletStore) => ({
        ...walletStore,
        status: WalletConnectionStatus.ERROR
      }));
    }
  } else {
    wallet$.update((walletStore) => ({
      ...walletStore,
      status: WalletConnectionStatus.DISCONNECTED
    }));
  }
}

/**
 * Disconnect wallet
 */
async function disconnect() {
  const { wallet, localStorageKey } = get(wallet$);

  if (wallet) {
    await wallet.disconnect();
    wallet$.update((walletStore) => ({
      ...walletStore,
      status: WalletConnectionStatus.DISCONNECTED,
      wallet: null
    }));
    setLocalStorage(localStorageKey, null);
  }
}

/**
 * Sign transaction block
 */
async function signTransactionBlock(input: {
  transactionBlock: Uint8Array | TransactionBlock;
}): Promise<SignedTransaction> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');
  if (!wallet.signTransactionBlock)
    throw new Error('Wallet does not support "signTransactionBlock" method');

  return wallet.signTransactionBlock(input as any);
}

async function getAccounts(): Promise<any> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');
  return wallet.getAccounts();
}

function getInitialAdapters(
  configuredAdapters = null,
  enableUnsafeBurner = false,
  features?: string[]
) {
  const adapters = configuredAdapters ?? [
    new WalletStandardAdapterProvider({ features }),
    ...(enableUnsafeBurner ? [new UnsafeBurnerWalletAdapter()] : [])
  ];

  return adapters;
}

function getWallets(adapterAndProviders: WalletAdapterList) {
  const wallets = resolveAdapters(adapterAndProviders);

  return wallets;
}
