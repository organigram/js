import { exportUserPublicKey, generateUserEncryptionKeyPair } from './crypto'
import {
  createEncryptionKeyVersion,
  normalizeEncryptionKeyVersion
} from './keyVersion'
import type { StoredUserEncryptionKeyPair } from './types'

const indexedDbName = 'organigram-encryption'
const indexedDbStoreName = 'user-keypairs'

const openKeyDatabase = async (): Promise<IDBDatabase> =>
  await new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment.'))
      return
    }
    const request = indexedDB.open(indexedDbName, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(indexedDbStoreName)
    }
    request.onerror = () => {
      reject(request.error)
    }
    request.onsuccess = () => {
      resolve(request.result)
    }
  })

export const loadUserEncryptionKeyPair = async (
  address: string
): Promise<StoredUserEncryptionKeyPair | null> => {
  const db = await openKeyDatabase()
  return await new Promise((resolve, reject) => {
    const transaction = db.transaction(indexedDbStoreName, 'readonly')
    const store = transaction.objectStore(indexedDbStoreName)
    const request = store.get(address.toLowerCase())
    request.onerror = () => {
      reject(request.error)
    }
    request.onsuccess = () => {
      resolve((request.result as StoredUserEncryptionKeyPair | undefined) ?? null)
    }
  })
}

export const saveUserEncryptionKeyPair = async (
  address: string,
  value: StoredUserEncryptionKeyPair
): Promise<void> => {
  const db = await openKeyDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(indexedDbStoreName, 'readwrite')
    const store = transaction.objectStore(indexedDbStoreName)
    const request = store.put(value, address.toLowerCase())
    request.onerror = () => {
      reject(request.error)
    }
    request.onsuccess = () => {
      resolve()
    }
  })
}

export const ensureUserEncryptionKeyPair = async (
  address: string
): Promise<StoredUserEncryptionKeyPair> => {
  const existing = await loadUserEncryptionKeyPair(address)
  if (existing != null) {
    const normalizedKeyVersion =
      normalizeEncryptionKeyVersion(existing.keyVersion) ??
      createEncryptionKeyVersion()
    if (normalizedKeyVersion !== existing.keyVersion) {
      const normalizedValue = {
        ...existing,
        keyVersion: normalizedKeyVersion
      }
      await saveUserEncryptionKeyPair(address, normalizedValue)
      return normalizedValue
    }
    return existing
  }
  const keyPair = await generateUserEncryptionKeyPair()
  const publicKey = await exportUserPublicKey(keyPair)
  const value = {
    keyPair,
    publicKey,
    keyVersion: createEncryptionKeyVersion()
  }
  await saveUserEncryptionKeyPair(address, value)
  return value
}
