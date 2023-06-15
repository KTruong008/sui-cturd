import { get, writable } from 'svelte/store';
import type { SignedTransaction, TransactionBlock } from '@mysten/sui.js';
import type { WalletAdapterList } from '@mysten/wallet-adapter-base';
import { isWalletProvider, resolveAdapters } from '@mysten/wallet-adapter-base';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';
import { UnsafeBurnerWalletAdapter } from '@mysten/wallet-adapter-unsafe-burner';

import { getLocalStorage, setLocalStorage } from './local-storage';
import { WalletConnectionStatus, type WalletStore } from './wallet.type';
import { wallet$ } from './wallet';

export async function initialize({ autoConnect = true }) {
  wallet$.initializeWallet({
    autoConnect
  });
}

/**
 * Event listeners for adapters
 */
export function addAdapterEventListeners(walletAdapterList: WalletAdapterList) {
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

export function removeAdapterEventListeners() {
  const { adapterListeners } = get(wallet$);

  adapterListeners.forEach((unlisten) => {
    // Adapater-specific method returned from 'changed' event listener
    unlisten();
  });
}

/**
 * Select wallet
 */
export async function select(walletName: string) {
  const { wallets, localStorageKey } = get(wallet$);
  const selectedWallet = wallets.find((wallet) => wallet?.name === walletName) ?? null;
  setLocalStorage(localStorageKey, walletName);

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
      // @NOTE Ethos wallet gets stuck here for some reason.
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
export async function disconnect() {
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
export async function signTransactionBlock(input: {
  transactionBlock: Uint8Array | TransactionBlock;
}): Promise<SignedTransaction> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');
  if (!wallet.signTransactionBlock)
    throw new Error('Wallet does not support "signTransactionBlock" method');

  return wallet.signTransactionBlock(input as any);
}

export async function getAccounts(): Promise<any> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');
  return wallet.getAccounts();
}

export function getInitialAdapters(
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

export function getWallets(adapterAndProviders: WalletAdapterList) {
  const wallets = resolveAdapters(adapterAndProviders);

  return wallets;
}
