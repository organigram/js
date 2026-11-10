export const MAX_ENCRYPTION_KEY_VERSION = 2147483647

/** Create a key version from a date, as a Unix timestamp in seconds. */
export const createEncryptionKeyVersion = (timestamp = Date.now()): number =>
  Math.floor(timestamp / 1000)

/**
 * Turn a key version into Unix seconds, accepting milliseconds, or return `null` if it is invalid.
 */
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

/** Tell whether a key version is already a valid Unix timestamp in seconds. */
export const isValidEncryptionKeyVersion = (keyVersion: number): boolean =>
  normalizeEncryptionKeyVersion(keyVersion) === keyVersion
