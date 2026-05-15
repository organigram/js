import type { StoredUserEncryptionKeyPair, UserEncryptionKeyBackup } from './types';
export declare const exportUserEncryptionKeyBackup: (address: string, passphrase: string) => Promise<UserEncryptionKeyBackup>;
export declare const importUserEncryptionKeyBackup: (backup: UserEncryptionKeyBackup, passphrase: string) => Promise<StoredUserEncryptionKeyPair>;
