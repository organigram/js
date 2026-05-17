import {
  ENCRYPTED_CID_KIND,
  ENCRYPTION_ALGORITHM,
  FILE_VERSION_MANIFEST_KIND
} from './constants'

import type {
  EncryptedCidAccessGroup,
  EncryptedCidContentType,
  EncryptedCidManifest,
  FileVersionManifest,
  PublicFileVersionManifest,
  WrappedContentKey
} from './types'

export const createEncryptedCidManifest = (input: {
  contentType: EncryptedCidContentType
  accessGroup?: EncryptedCidAccessGroup
  scopeRef?: FileVersionManifest['scopeRef']
  logicalKey?: string
  retentionState?: FileVersionManifest['retentionState']
  previousManifestCid?: string
  encryptedCid: string
  encryptedContentIv: string
  encryptedContentSize: number
  wrappedContentKey: WrappedContentKey
  mime?: string
  name?: string
  scopeEnvelope?: FileVersionManifest['scopeEnvelope']
  signature?: string
  signedByAddress?: string
}): EncryptedCidManifest => ({
  kind: FILE_VERSION_MANIFEST_KIND,
  version: 1,
  contentType: input.contentType,
  accessGroup: input.accessGroup,
  scopeRef: input.scopeRef,
  logicalKey: input.logicalKey,
  retentionState: input.retentionState,
  previousManifestCid: input.previousManifestCid,
  encryptedContent: {
    cid: input.encryptedCid,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: input.encryptedContentIv,
    size: input.encryptedContentSize,
    mime: input.mime,
    name: input.name
  },
  wrappedContentKey: input.wrappedContentKey,
  scopeEnvelope: input.scopeEnvelope,
  signature: input.signature,
  signedByAddress: input.signedByAddress,
  createdAt: new Date().toISOString()
})

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

export const isFileVersionManifest = (
  value: unknown
): value is FileVersionManifest =>
  isEncryptedCidManifest(value) || isPublicFileVersionManifest(value)
