import type { EncryptionPublicKeySiweResource } from './types';
/** Build the message a user signs to register an encryption public key. */
export declare const createEncryptionPublicKeyMessage: (address: string, publicKey: JsonWebKey, keyVersion: number) => string;
/** Encode an encryption public key as a Sign-In with Ethereum resource. */
export declare const createEncryptionPublicKeySiweResource: (address: string, publicKey: JsonWebKey, keyVersion: number) => string;
/**
 * Find the encryption public key of an address among Sign-In with Ethereum resources.
 */
export declare const parseEncryptionPublicKeySiweResource: (resources: string[] | undefined, address: string) => EncryptionPublicKeySiweResource | null;
