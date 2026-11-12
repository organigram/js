import type { RecipientEncryptionKey, WrappedContentKey, WrappedGroupKey } from './types';
export declare const aesKeyAlgorithm: {
    readonly name: "AES-GCM";
    readonly length: 256;
};
/** Return the Web Crypto API, and throw where it is unavailable. */
export declare const getCrypto: () => Crypto;
/** Generate a random 12-byte initialization vector for AES-GCM. */
export declare const getRandomIv: () => Uint8Array;
/**
 * Generate the ECDH P-256 key pair a user decrypts their group keys with.
 *
 * @remarks Keep the private key on the user's device: never send it to a server or log it.
 */
export declare const generateUserEncryptionKeyPair: () => Promise<CryptoKeyPair>;
/** Export the public half of a user key pair as a JSON Web Key, to publish it. */
export declare const exportUserPublicKey: (keyPair: CryptoKeyPair) => Promise<JsonWebKey>;
export declare const importUserPublicKey: (publicKey: JsonWebKey) => Promise<CryptoKey>;
/** Import a user public key from a JSON Web Key, keeping it exportable. */
export declare const importExtractableUserPublicKey: (publicKey: JsonWebKey) => Promise<CryptoKey>;
/**
 * Export the private half of a user key pair as a JSON Web Key.
 *
 * @remarks Only store the result encrypted, for example in a passkey vault.
 */
export declare const exportUserPrivateKey: (keyPair: CryptoKeyPair) => Promise<JsonWebKey>;
/** Import a user private key from a JSON Web Key. */
export declare const importUserPrivateKey: (privateKey: JsonWebKey) => Promise<CryptoKey>;
/** Generate the AES key shared by the members of an access group. */
export declare const generateGroupKey: () => Promise<CryptoKey>;
/** Generate the AES key that encrypts one file. */
export declare const generateContentKey: () => Promise<CryptoKey>;
export declare const exportSymmetricKey: (key: CryptoKey) => Promise<Uint8Array>;
export declare const importSymmetricKey: (rawKey: ArrayBuffer | Uint8Array) => Promise<CryptoKey>;
/** Encrypt a group key for one member, with their public key. */
export declare const wrapGroupKeyForRecipient: (groupKey: CryptoKey, recipient: RecipientEncryptionKey) => Promise<WrappedGroupKey>;
/** Decrypt a group key with the private key of its recipient. */
export declare const unwrapGroupKey: (wrappedGroupKey: WrappedGroupKey, recipientPrivateKey: CryptoKey) => Promise<CryptoKey>;
/** Encrypt a content key with a group key. */
export declare const wrapContentKey: (contentKey: CryptoKey, groupKey: CryptoKey) => Promise<WrappedContentKey>;
/** Decrypt a content key with a group key. */
export declare const unwrapContentKey: (wrappedContentKey: WrappedContentKey, groupKey: CryptoKey) => Promise<CryptoKey>;
/**
 * Encrypt bytes with AES-GCM, and return the ciphertext with its initialization vector.
 */
export declare const encryptBytes: (bytes: ArrayBuffer | Uint8Array, key: CryptoKey) => Promise<{
    encryptedBytes: Uint8Array;
    iv: string;
}>;
/** Decrypt bytes encrypted by `encryptBytes()`. */
export declare const decryptBytes: (encryptedBytes: ArrayBuffer | Uint8Array, key: CryptoKey, iv: string) => Promise<Uint8Array>;
