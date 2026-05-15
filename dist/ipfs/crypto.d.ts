import type { RecipientEncryptionKey, WrappedContentKey, WrappedGroupKey } from './types';
export declare const aesKeyAlgorithm: {
    readonly name: "AES-GCM";
    readonly length: 256;
};
export declare const getCrypto: () => Crypto;
export declare const getRandomIv: () => Uint8Array;
export declare const generateUserEncryptionKeyPair: () => Promise<CryptoKeyPair>;
export declare const exportUserPublicKey: (keyPair: CryptoKeyPair) => Promise<JsonWebKey>;
export declare const importUserPublicKey: (publicKey: JsonWebKey) => Promise<CryptoKey>;
export declare const importExtractableUserPublicKey: (publicKey: JsonWebKey) => Promise<CryptoKey>;
export declare const exportUserPrivateKey: (keyPair: CryptoKeyPair) => Promise<JsonWebKey>;
export declare const importUserPrivateKey: (privateKey: JsonWebKey) => Promise<CryptoKey>;
export declare const generateGroupKey: () => Promise<CryptoKey>;
export declare const generateContentKey: () => Promise<CryptoKey>;
export declare const exportSymmetricKey: (key: CryptoKey) => Promise<Uint8Array>;
export declare const importSymmetricKey: (rawKey: ArrayBuffer | Uint8Array) => Promise<CryptoKey>;
export declare const wrapGroupKeyForRecipient: (groupKey: CryptoKey, recipient: RecipientEncryptionKey) => Promise<WrappedGroupKey>;
export declare const unwrapGroupKey: (wrappedGroupKey: WrappedGroupKey, recipientPrivateKey: CryptoKey) => Promise<CryptoKey>;
export declare const wrapContentKey: (contentKey: CryptoKey, groupKey: CryptoKey) => Promise<WrappedContentKey>;
export declare const unwrapContentKey: (wrappedContentKey: WrappedContentKey, groupKey: CryptoKey) => Promise<CryptoKey>;
export declare const encryptBytes: (bytes: ArrayBuffer | Uint8Array, key: CryptoKey) => Promise<{
    encryptedBytes: Uint8Array;
    iv: string;
}>;
export declare const decryptBytes: (encryptedBytes: ArrayBuffer | Uint8Array, key: CryptoKey, iv: string) => Promise<Uint8Array>;
