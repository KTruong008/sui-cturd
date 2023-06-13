import type {
  SuiAddress,
  SuiTransactionBlockResponse,
  SignedTransaction,
  TransactionBlock
} from '@mysten/sui.js';
import { WalletAdapter, WalletAdapterList } from '@mysten/wallet-adapter-base';

function addAdapterEventListeners(adapter: Adapter) {
  const { onError, wallets } = get(walletStore);

  wallets.forEach(({ adapter }) => {
    adapter.on('readyStateChange', onReadyStateChange, adapter);
  });
  adapter.on('connect', onConnect);
  adapter.on('disconnect', onDisconnect);
  adapter.on('error', onError);
}

async function autoConnect() {
  const { adapter } = get(walletStore);

  try {
    walletStore.setConnecting(true);
    await adapter?.connect();
  } catch (error: unknown) {
    // Clear the selected wallet
    walletStore.resetWallet();
    // Don't throw error, but onError will still be called
  } finally {
    walletStore.setConnecting(false);
  }
}

async function connect(): Promise<void> {
  const { connected, connecting, disconnecting, ready, adapter } = get(walletStore);
  if (connected || connecting || disconnecting) return;

  if (!adapter) throw newError(new WalletNotSelectedError());

  if (!(ready === WalletReadyState.Installed || ready === WalletReadyState.Loadable)) {
    walletStore.resetWallet();

    if (typeof window !== 'undefined') {
      window.open(adapter.url, '_blank');
    }

    throw newError(new WalletNotReadyError());
  }

  try {
    walletStore.setConnecting(true);
    await adapter.connect();
  } catch (error: unknown) {
    walletStore.resetWallet();
    throw error;
  } finally {
    walletStore.setConnecting(false);
  }
}
