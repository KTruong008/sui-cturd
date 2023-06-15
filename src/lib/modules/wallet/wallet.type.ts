import type { SuiAddress, SignedTransaction, TransactionBlock } from '@mysten/sui.js';
import type { WalletAdapter, WalletAdapterList } from '@mysten/wallet-adapter-base';

export enum WalletConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  // TODO: Figure out if this is really a separate status, or is just a piece of state alongside the `disconnected` state:
  ERROR = 'ERROR'
}

export interface WalletStore {
  /**
   * Wallets are like the actual adapters (for wallet), and "adapters" are wallets with extra steps, and an extra "change" event listener.
   * I don't know why, but that's what the types say.
   */
  adapters: WalletAdapterList;
  wallets: WalletAdapter[];

  // Wallet that we are currently connected to
  wallet: WalletAdapter | null;
  localStorageKey: string;

  // States
  status: WalletConnectionStatus;
  connecting: boolean;
  connected: boolean;
  isError: boolean;

  // Methods
  select(walletName: string): void;
  disconnect(): Promise<void>;
  getAccounts: () => Promise<SuiAddress[]>;
  signTransactionBlock(input: {
    transactionBlock: Uint8Array | TransactionBlock;
  }): Promise<SignedTransaction>;

  // Misc.
  initializeWallet: any;
  // Used solely to keep track of and remove event listeners
  adapterListeners: any[];
}
