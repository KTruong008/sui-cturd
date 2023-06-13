import { get, writable } from 'svelte/store';
import type {
  SuiAddress,
  SuiTransactionBlockResponse,
  SignedTransaction,
  TransactionBlock
} from '@mysten/sui.js';
import type { WalletAdapter, WalletAdapterList } from '@mysten/wallet-adapter-base';
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
    signTransactionBlock
  });

  function initializeWallet() {
    // walletName
    // const { localStorageKey } = get(wallet$);
    // setLocalStorage(localStorageKey, walletName);
  }

  return {
    subscribe,
    update
  };
}

function addAdapterEventListeners(walletAdapterList: WalletAdapterList) {
  const walletProviders = walletAdapterList.filter(isWalletProvider);
  if (!walletProviders.length) return;

  // Re-resolve the adapters just in case a provider has injected
  // before we've been able to attach an event listener:
  wallet$.update((walletStore) => ({
    ...walletStore,
    wallets: resolveAdapters(walletAdapterList)
  }));

  walletProviders.forEach((walletProvider) => {
    walletProvider.on('changed', () => {
      wallet$.update((walletStore) => ({
        ...walletStore,
        wallets: resolveAdapters(walletAdapterList)
      }));
    });
  });
}

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
