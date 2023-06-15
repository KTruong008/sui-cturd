import { get } from 'svelte/store';
import type { SignedTransaction, TransactionBlock } from '@mysten/sui.js';
import type { WalletAdapterList } from '@mysten/wallet-adapter-base';
import { isWalletProvider, resolveAdapters } from '@mysten/wallet-adapter-base';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';
import { UnsafeBurnerWalletAdapter } from '@mysten/wallet-adapter-unsafe-burner';

import { setLocalStorage } from './local-storage';
import { WalletConnectionStatus } from './wallet.type';
import { wallet$ } from './wallet';

/**
 * Initialize wallet
 *
 * - Connect to wallet
 * - Set up event listeners for adapters
 * - Set initial state
 */
export async function initializeWallet({ autoConnect = true }) {
  wallet$.initialize({
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
  const { wallets, storageKey } = get(wallet$);
  const selectedWallet = wallets.find((wallet) => wallet?.name === walletName) ?? null;

  wallet$.update((walletStore) => ({
    ...walletStore,
    wallet: selectedWallet
  }));

  if (selectedWallet && !selectedWallet?.connecting) {
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
      setLocalStorage(storageKey, walletName);
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
  const { wallet, storageKey } = get(wallet$);

  setLocalStorage(storageKey, null);

  if (wallet) {
    await wallet?.disconnect?.();
    wallet$.update((walletStore) => ({
      ...walletStore,
      status: WalletConnectionStatus.DISCONNECTED,
      wallet: null
    }));
  }
}

/**
 * Sign transaction block
 *
 * Just a wrapper around the wallet's signTransactionBlock method.
 */
export async function signTransactionBlock(input: {
  transactionBlock: Uint8Array | TransactionBlock;
}): Promise<SignedTransaction> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');
  if (!wallet?.signTransactionBlock)
    throw new Error('Wallet does not support "signTransactionBlock" method');

  // Some type mismatch, but I think it's actually correct.
  return wallet.signTransactionBlock(input as any);
}

export async function getAccounts(): Promise<any> {
  const { wallet } = get(wallet$);

  if (!wallet) throw new Error('Wallet Not Connected');

  return wallet.getAccounts();
}

/**
 * Utilities
 */
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
