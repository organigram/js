export declare const MAX_ENCRYPTION_KEY_VERSION = 2147483647;
export declare const createEncryptionKeyVersion: (timestamp?: number) => number;
export declare const normalizeEncryptionKeyVersion: (keyVersion: number) => number | null;
export declare const isValidEncryptionKeyVersion: (keyVersion: number) => boolean;
