import type {
  SuiAddress,
  SuiTransactionBlockResponse,
  SignedTransaction,
  TransactionBlock
} from '@mysten/sui.js';
import type { WalletAdapter, WalletAdapterList } from '@mysten/wallet-adapter-base';

export enum WalletConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  // TODO: Figure out if this is really a separate status, or is just a piece of state alongside the `disconnected` state:
  ERROR = 'ERROR'
}

export interface WalletStore {
  adapters: WalletAdapterList;
  wallets: WalletAdapter[];

  // Wallet that we are currently connected to
  wallet: WalletAdapter | null;
  localStorageKey: string;

  status: WalletConnectionStatus;
  connecting: boolean;
  connected: boolean;
  isError: boolean;

  select(walletName: string): void;
  disconnect(): Promise<void>;
  getAccounts: () => Promise<SuiAddress[]>;
  signTransactionBlock(input: {
    transactionBlock: Uint8Array | TransactionBlock;
  }): Promise<SignedTransaction>;
}
