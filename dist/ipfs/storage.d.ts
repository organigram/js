import type { StoredUserEncryptionKeyPair } from './types';
export declare const loadUserEncryptionKeyPair: (address: string) => Promise<StoredUserEncryptionKeyPair | null>;
export declare const saveUserEncryptionKeyPair: (address: string, value: StoredUserEncryptionKeyPair) => Promise<void>;
export declare const ensureUserEncryptionKeyPair: (address: string) => Promise<StoredUserEncryptionKeyPair>;
