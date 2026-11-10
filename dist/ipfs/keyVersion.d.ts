export declare const MAX_ENCRYPTION_KEY_VERSION = 2147483647;
/** Create a key version from a date, as a Unix timestamp in seconds. */
export declare const createEncryptionKeyVersion: (timestamp?: number) => number;
/**
 * Turn a key version into Unix seconds, accepting milliseconds, or return `null` if it is invalid.
 */
export declare const normalizeEncryptionKeyVersion: (keyVersion: number) => number | null;
/** Tell whether a key version is already a valid Unix timestamp in seconds. */
export declare const isValidEncryptionKeyVersion: (keyVersion: number) => boolean;
