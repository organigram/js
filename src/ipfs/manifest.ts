import { ENCRYPTED_CID_KIND, FILE_VERSION_MANIFEST_KIND } from './constants'

import type {
  EncryptedCidManifest,
  FileVersionManifest,
  PublicFileVersionManifest
} from './types'

/** Tell whether a value is the manifest of an encrypted file. */
export const isEncryptedCidManifest = (
  value: unknown
): value is EncryptedCidManifest => {
  const candidate = value as Partial<EncryptedCidManifest> | undefined
  return (
    (candidate?.kind === ENCRYPTED_CID_KIND ||
      candidate?.kind === FILE_VERSION_MANIFEST_KIND) &&
    candidate.version === 1 &&
    candidate.encryptedContent?.cid != null &&
    candidate.wrappedContentKey?.ciphertext != null
  )
}

export const isPublicFileVersionManifest = (
  value: unknown
): value is PublicFileVersionManifest => {
  const candidate = value as Partial<PublicFileVersionManifest> | undefined
  return (
    candidate?.kind === FILE_VERSION_MANIFEST_KIND &&
    candidate.version === 1 &&
    candidate.publicContent?.cid != null
  )
}

/** Tell whether a value is a file-version manifest, public or encrypted. */
export const isFileVersionManifest = (
  value: unknown
): value is FileVersionManifest =>
  isEncryptedCidManifest(value) || isPublicFileVersionManifest(value)
