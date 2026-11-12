import { ENCRYPTION_ALGORITHM, GROUP_KEY_ALGORITHM } from './constants'
import {
  base64ToBytes,
  bytesToArrayBuffer,
  bytesToBase64
} from './encoding'
import type {
  RecipientEncryptionKey,
  WrappedContentKey,
  WrappedGroupKey
} from './types'

const userKeyAlgorithm = { name: 'ECDH', namedCurve: 'P-256' } as const
export const aesKeyAlgorithm = { name: 'AES-GCM', length: 256 } as const
const aesIvLength = 12

/** Return the Web Crypto API, and throw where it is unavailable. */
export const getCrypto = (): Crypto => {
  if (globalThis.crypto?.subtle == null) {
    throw new Error('Web Crypto is not available in this environment.')
  }
  return globalThis.crypto
}

/** Generate a random 12-byte initialization vector for AES-GCM. */
export const getRandomIv = (): Uint8Array =>
  getCrypto().getRandomValues(new Uint8Array(aesIvLength))

/**
 * Generate the ECDH P-256 key pair a user decrypts their group keys with.
 *
 * @remarks Keep the private key on the user's device: never send it to a server or log it.
 */
export const generateUserEncryptionKeyPair =
  async (): Promise<CryptoKeyPair> =>
    await getCrypto().subtle.generateKey(userKeyAlgorithm, true, [
      'deriveKey',
      'deriveBits'
    ])

/** Export the public half of a user key pair as a JSON Web Key, to publish it. */
export const exportUserPublicKey = async (
  keyPair: CryptoKeyPair
): Promise<JsonWebKey> => await getCrypto().subtle.exportKey('jwk', keyPair.publicKey)

export const importUserPublicKey = async (
  publicKey: JsonWebKey
): Promise<CryptoKey> =>
  await getCrypto().subtle.importKey('jwk', publicKey, userKeyAlgorithm, false, [])

/** Import a user public key from a JSON Web Key, keeping it exportable. */
export const importExtractableUserPublicKey = async (
  publicKey: JsonWebKey
): Promise<CryptoKey> =>
  await getCrypto().subtle.importKey('jwk', publicKey, userKeyAlgorithm, true, [])

/**
 * Export the private half of a user key pair as a JSON Web Key.
 *
 * @remarks Only store the result encrypted, for example in a passkey vault.
 */
export const exportUserPrivateKey = async (
  keyPair: CryptoKeyPair
): Promise<JsonWebKey> => await getCrypto().subtle.exportKey('jwk', keyPair.privateKey)

/** Import a user private key from a JSON Web Key. */
export const importUserPrivateKey = async (
  privateKey: JsonWebKey
): Promise<CryptoKey> =>
  await getCrypto().subtle.importKey('jwk', privateKey, userKeyAlgorithm, true, [
    'deriveKey',
    'deriveBits'
  ])

/** Generate the AES key shared by the members of an access group. */
export const generateGroupKey = async (): Promise<CryptoKey> =>
  await getCrypto().subtle.generateKey(aesKeyAlgorithm, true, [
    'encrypt',
    'decrypt'
  ])

/** Generate the AES key that encrypts one file. */
export const generateContentKey = async (): Promise<CryptoKey> =>
  await getCrypto().subtle.generateKey(aesKeyAlgorithm, true, [
    'encrypt',
    'decrypt'
  ])

export const exportSymmetricKey = async (key: CryptoKey): Promise<Uint8Array> =>
  new Uint8Array(await getCrypto().subtle.exportKey('raw', key))

export const importSymmetricKey = async (
  rawKey: ArrayBuffer | Uint8Array
): Promise<CryptoKey> =>
  await getCrypto().subtle.importKey(
    'raw',
    bytesToArrayBuffer(rawKey),
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  )

const deriveWrappingKey = async (
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> =>
  await getCrypto().subtle.deriveKey(
    { name: 'ECDH', public: publicKey },
    privateKey,
    aesKeyAlgorithm,
    false,
    ['encrypt', 'decrypt']
  )

/** Encrypt a group key for one member, with their public key. */
export const wrapGroupKeyForRecipient = async (
  groupKey: CryptoKey,
  recipient: RecipientEncryptionKey
): Promise<WrappedGroupKey> => {
  const recipientPublicKey = await importUserPublicKey(recipient.publicKey)
  const ephemeralKeyPair = await generateUserEncryptionKeyPair()
  const wrappingKey = await deriveWrappingKey(
    ephemeralKeyPair.privateKey,
    recipientPublicKey
  )
  const iv = getRandomIv()
  const rawGroupKey = await exportSymmetricKey(groupKey)
  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    wrappingKey,
    bytesToArrayBuffer(rawGroupKey)
  )

  return {
    algorithm: GROUP_KEY_ALGORITHM,
    recipientAddress: recipient.address.toLowerCase(),
    recipientKeyVersion: recipient.keyVersion,
    ephemeralPublicKey: await exportUserPublicKey(ephemeralKeyPair),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext)
  }
}

/** Decrypt a group key with the private key of its recipient. */
export const unwrapGroupKey = async (
  wrappedGroupKey: WrappedGroupKey,
  recipientPrivateKey: CryptoKey
): Promise<CryptoKey> => {
  const ephemeralPublicKey = await importUserPublicKey(
    wrappedGroupKey.ephemeralPublicKey
  )
  const wrappingKey = await deriveWrappingKey(
    recipientPrivateKey,
    ephemeralPublicKey
  )
  const rawGroupKey = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(base64ToBytes(wrappedGroupKey.iv)) },
    wrappingKey,
    bytesToArrayBuffer(base64ToBytes(wrappedGroupKey.ciphertext))
  )
  return await importSymmetricKey(rawGroupKey)
}

/** Encrypt a content key with a group key. */
export const wrapContentKey = async (
  contentKey: CryptoKey,
  groupKey: CryptoKey
): Promise<WrappedContentKey> => {
  const iv = getRandomIv()
  const rawContentKey = await exportSymmetricKey(contentKey)
  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    groupKey,
    bytesToArrayBuffer(rawContentKey)
  )
  return {
    algorithm: ENCRYPTION_ALGORITHM,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext)
  }
}

/** Decrypt a content key with a group key. */
export const unwrapContentKey = async (
  wrappedContentKey: WrappedContentKey,
  groupKey: CryptoKey
): Promise<CryptoKey> => {
  const rawContentKey = await getCrypto().subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: bytesToArrayBuffer(base64ToBytes(wrappedContentKey.iv))
    },
    groupKey,
    bytesToArrayBuffer(base64ToBytes(wrappedContentKey.ciphertext))
  )
  return await importSymmetricKey(rawContentKey)
}

/**
 * Encrypt bytes with AES-GCM, and return the ciphertext with its initialization vector.
 */
export const encryptBytes = async (
  bytes: ArrayBuffer | Uint8Array,
  key: CryptoKey
): Promise<{ encryptedBytes: Uint8Array; iv: string }> => {
  const iv = getRandomIv()
  const encryptedBytes = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    key,
    bytesToArrayBuffer(bytes)
  )
  return {
    encryptedBytes: new Uint8Array(encryptedBytes),
    iv: bytesToBase64(iv)
  }
}

/** Decrypt bytes encrypted by `encryptBytes()`. */
export const decryptBytes = async (
  encryptedBytes: ArrayBuffer | Uint8Array,
  key: CryptoKey,
  iv: string
): Promise<Uint8Array> =>
  new Uint8Array(
    await getCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: bytesToArrayBuffer(base64ToBytes(iv)) },
      key,
      bytesToArrayBuffer(encryptedBytes)
    )
  )
