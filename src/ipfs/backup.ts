import { USER_ENCRYPTION_KEY_BACKUP_KIND } from './constants'
import {
  aesKeyAlgorithm,
  exportUserPrivateKey,
  getCrypto,
  getRandomIv,
  importExtractableUserPublicKey,
  importUserPrivateKey
} from './crypto'
import {
  base64ToBytes,
  bytesToArrayBuffer,
  bytesToBase64,
  bytesToText,
  textToBytes
} from './encoding'
import { normalizeEncryptionKeyVersion } from './keyVersion'
import { loadUserEncryptionKeyPair, saveUserEncryptionKeyPair } from './storage'
import type { StoredUserEncryptionKeyPair, UserEncryptionKeyBackup } from './types'

const backupSaltLength = 16
const backupKeyIterations = 310_000

const deriveBackupEncryptionKey = async (
  passphrase: string,
  salt: Uint8Array,
  iterations = backupKeyIterations
): Promise<CryptoKey> => {
  const passphraseKey = await getCrypto().subtle.importKey(
    'raw',
    bytesToArrayBuffer(textToBytes(passphrase)),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return await getCrypto().subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: bytesToArrayBuffer(salt),
      iterations
    },
    passphraseKey,
    aesKeyAlgorithm,
    false,
    ['encrypt', 'decrypt']
  )
}

export const exportUserEncryptionKeyBackup = async (
  address: string,
  passphrase: string
): Promise<UserEncryptionKeyBackup> => {
  if (passphrase === '') {
    throw new Error('A passphrase is required to export an encryption key backup.')
  }
  const storedKeyPair = await loadUserEncryptionKeyPair(address)
  if (storedKeyPair == null) {
    throw new Error('No local encryption key was found for this user.')
  }
  const keyVersion = normalizeEncryptionKeyVersion(storedKeyPair.keyVersion)
  if (keyVersion == null) {
    throw new Error('Invalid local encryption key version.')
  }
  const privateKey = await exportUserPrivateKey(storedKeyPair.keyPair)
  const salt = getCrypto().getRandomValues(new Uint8Array(backupSaltLength))
  const iv = getRandomIv()
  const backupKey = await deriveBackupEncryptionKey(passphrase, salt)
  const ciphertext = await getCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    backupKey,
    bytesToArrayBuffer(textToBytes(JSON.stringify(privateKey)))
  )

  return {
    kind: USER_ENCRYPTION_KEY_BACKUP_KIND,
    address: address.toLowerCase(),
    publicKey: storedKeyPair.publicKey,
    keyVersion,
    privateKey: {
      algorithm: 'PBKDF2-SHA256+A256GCM',
      iterations: backupKeyIterations,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(ciphertext)
    },
    createdAt: new Date().toISOString()
  }
}

export const importUserEncryptionKeyBackup = async (
  backup: UserEncryptionKeyBackup,
  passphrase: string
): Promise<StoredUserEncryptionKeyPair> => {
  if (backup.kind !== USER_ENCRYPTION_KEY_BACKUP_KIND) {
    throw new Error('Invalid encryption key backup.')
  }
  if (backup.privateKey.algorithm !== 'PBKDF2-SHA256+A256GCM') {
    throw new Error('Unsupported encryption key backup algorithm.')
  }
  if (passphrase === '') {
    throw new Error('A passphrase is required to import an encryption key backup.')
  }
  const keyVersion = normalizeEncryptionKeyVersion(backup.keyVersion)
  if (keyVersion == null) {
    throw new Error('Invalid encryption key backup version.')
  }
  const salt = base64ToBytes(backup.privateKey.salt)
  const iv = base64ToBytes(backup.privateKey.iv)
  const backupKey = await deriveBackupEncryptionKey(
    passphrase,
    salt,
    backup.privateKey.iterations
  )
  const plaintext = await getCrypto().subtle.decrypt(
    { name: 'AES-GCM', iv: bytesToArrayBuffer(iv) },
    backupKey,
    bytesToArrayBuffer(base64ToBytes(backup.privateKey.ciphertext))
  )
  const privateKey = await importUserPrivateKey(
    JSON.parse(bytesToText(plaintext)) as JsonWebKey
  )
  const publicKey = await importExtractableUserPublicKey(backup.publicKey)
  const value = {
    keyPair: { privateKey, publicKey },
    publicKey: backup.publicKey,
    keyVersion
  }
  await saveUserEncryptionKeyPair(backup.address, value)
  return value
}
