import { ENCRYPTION_ALGORITHM, GROUP_KEY_ALGORITHM } from './constants';
import { base64ToBytes, bytesToArrayBuffer, bytesToBase64 } from './encoding';
const userKeyAlgorithm = { name: 'ECDH', namedCurve: 'P-256' };
export const aesKeyAlgorithm = { name: 'AES-GCM', length: 256 };
const aesIvLength = 12;
/** Return the Web Crypto API, and throw where it is unavailable. */
export const getCrypto = () => {
    if (globalThis.crypto?.subtle == null) {
        throw new Error('Web Crypto is not available in this environment.');
    }
    return globalThis.crypto;
};
/** Generate a random 12-byte initialization vector for AES-GCM. */
export const getRandomIv = () => getCrypto().getRandomValues(new Uint8Array(aesIvLength));
/**
 * Generate the ECDH P-256 key pair a user decrypts their group keys with.
 *
 * @remarks Keep the private key on the user's device: never send it to a server or log it.
 */
export const generateUserEncryptionKeyPair = async () => await getCrypto().subtle.generateKey(userKeyAlgorithm, true, [
    'deriveKey',
    'deriveBits'
]);
/** Export the public half of a user key pair as a JSON Web Key, to publish it. */
export const exportUserPublicKey = async (keyPair) => await getCrypto().subtle.exportKey('jwk', keyPair.publicKey);
export const importUserPublicKey = async (publicKey) => await getCrypto().subtle.importKey('jwk', publicKey, userKeyAlgorithm, false, []);
/** Import a user public key from a JSON Web Key, keeping it exportable. */
export const importExtractableUserPublicKey = async (publicKey) => await getCrypto().subtle.importKey('jwk', publicKey, userKeyAlgorithm, true, []);
/**
 * Export the private half of a user key pair as a JSON Web Key.
 *
 * @remarks Only store the result encrypted, for example in a passkey vault.
 */
export const exportUserPrivateKey = async (keyPair) => await getCrypto().subtle.exportKey('jwk', keyPair.privateKey);
/** Import a user private key from a JSON Web Key. */
export const importUserPrivateKey = async (privateKey) => await getCrypto().subtle.importKey('jwk', privateKey, userKeyAlgorithm, true, [
    'deriveKey',
    'deriveBits'
]);
/** Generate the AES key shared by the members of an access group. */
export const generateGroupKey = async () => await getCrypto().subtle.generateKey(aesKeyAlgorithm, true, [
    'encrypt',
    'decrypt'
]);
/** Generate the AES key that encrypts one file. */
export const generateContentKey = async () => await getCrypto().subtle.generateKey(aesKeyAlgorithm, true, [
    'encrypt',
    'decrypt'
]);
export const exportSymmetricKey = async (key) => new Uint8Array(await getCrypto().subtle.exportKey('raw', key));
export const importSymmetricKey = async (rawKey) => await getCrypto().subtle.importKey('raw', bytesToArrayBuffer(rawKey), 'AES-GCM', true, ['encrypt', 'decrypt']);
const deriveWrappingKey = async (privateKey, publicKey) => await getCrypto().subtle.deriveKey({ name: 'ECDH', public: publicKey }, privateKey, aesKeyAlgorithm, false, ['encrypt', 'decrypt']);
/** Encrypt a group key for one member, with their public key. */
export const wrapGroupKeyForRecipient = async (groupKey, recipient) => {
    const recipientPublicKey = await importUserPublicKey(recipient.publicKey);
    const ephemeralKeyPair = await generateUserEncryptionKeyPair();
    const wrappingKey = await deriveWrappingKey(ephemeralKeyPair.privateKey, recipientPublicKey);
    const iv = getRandomIv();
    const rawGroupKey = await exportSymmetricKey(groupKey);
    const ciphertext = await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv: bytesToArrayBuffer(iv) }, wrappingKey, bytesToArrayBuffer(rawGroupKey));
    return {
        algorithm: GROUP_KEY_ALGORITHM,
        recipientAddress: recipient.address.toLowerCase(),
        recipientKeyVersion: recipient.keyVersion,
        ephemeralPublicKey: await exportUserPublicKey(ephemeralKeyPair),
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(ciphertext)
    };
};
/** Decrypt a group key with the private key of its recipient. */
export const unwrapGroupKey = async (wrappedGroupKey, recipientPrivateKey) => {
    const ephemeralPublicKey = await importUserPublicKey(wrappedGroupKey.ephemeralPublicKey);
    const wrappingKey = await deriveWrappingKey(recipientPrivateKey, ephemeralPublicKey);
    const rawGroupKey = await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv: bytesToArrayBuffer(base64ToBytes(wrappedGroupKey.iv)) }, wrappingKey, bytesToArrayBuffer(base64ToBytes(wrappedGroupKey.ciphertext)));
    return await importSymmetricKey(rawGroupKey);
};
/** Encrypt a content key with a group key. */
export const wrapContentKey = async (contentKey, groupKey) => {
    const iv = getRandomIv();
    const rawContentKey = await exportSymmetricKey(contentKey);
    const ciphertext = await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv: bytesToArrayBuffer(iv) }, groupKey, bytesToArrayBuffer(rawContentKey));
    return {
        algorithm: ENCRYPTION_ALGORITHM,
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(ciphertext)
    };
};
/** Decrypt a content key with a group key. */
export const unwrapContentKey = async (wrappedContentKey, groupKey) => {
    const rawContentKey = await getCrypto().subtle.decrypt({
        name: 'AES-GCM',
        iv: bytesToArrayBuffer(base64ToBytes(wrappedContentKey.iv))
    }, groupKey, bytesToArrayBuffer(base64ToBytes(wrappedContentKey.ciphertext)));
    return await importSymmetricKey(rawContentKey);
};
/**
 * Encrypt bytes with AES-GCM, and return the ciphertext with its initialization vector.
 */
export const encryptBytes = async (bytes, key) => {
    const iv = getRandomIv();
    const encryptedBytes = await getCrypto().subtle.encrypt({ name: 'AES-GCM', iv: bytesToArrayBuffer(iv) }, key, bytesToArrayBuffer(bytes));
    return {
        encryptedBytes: new Uint8Array(encryptedBytes),
        iv: bytesToBase64(iv)
    };
};
/** Decrypt bytes encrypted by `encryptBytes()`. */
export const decryptBytes = async (encryptedBytes, key, iv) => new Uint8Array(await getCrypto().subtle.decrypt({ name: 'AES-GCM', iv: bytesToArrayBuffer(base64ToBytes(iv)) }, key, bytesToArrayBuffer(encryptedBytes)));
