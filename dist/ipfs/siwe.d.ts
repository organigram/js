import type { EncryptionPublicKeySiweResource } from './types';
export declare const createEncryptionPublicKeyMessage: (address: string, publicKey: JsonWebKey, keyVersion: number) => string;
export declare const createEncryptionPublicKeySiweResource: (address: string, publicKey: JsonWebKey, keyVersion: number) => string;
export declare const parseEncryptionPublicKeySiweResource: (resources: string[] | undefined, address: string) => EncryptionPublicKeySiweResource | null;
