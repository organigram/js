export const MAX_ENCRYPTION_KEY_VERSION = 2147483647

export const createEncryptionKeyVersion = (timestamp = Date.now()): number =>
  Math.floor(timestamp / 1000)

export const normalizeEncryptionKeyVersion = (
  keyVersion: number
): number | null => {
  if (!Number.isFinite(keyVersion) || keyVersion <= 0) return null

  const integerKeyVersion = Math.floor(keyVersion)
  if (integerKeyVersion <= MAX_ENCRYPTION_KEY_VERSION) {
    return integerKeyVersion
  }

  const unixSecondsKeyVersion = Math.floor(integerKeyVersion / 1000)
  return unixSecondsKeyVersion > 0 &&
    unixSecondsKeyVersion <= MAX_ENCRYPTION_KEY_VERSION
    ? unixSecondsKeyVersion
    : null
}

export const isValidEncryptionKeyVersion = (keyVersion: number): boolean =>
  normalizeEncryptionKeyVersion(keyVersion) === keyVersion
