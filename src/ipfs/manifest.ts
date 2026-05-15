import { ENCRYPTED_CID_KIND, ENCRYPTION_ALGORITHM } from './constants'
import type {
  EncryptedCidAccessGroup,
  EncryptedCidContentType,
  EncryptedCidManifest,
  WrappedContentKey
} from './types'

export const createEncryptedCidManifest = (input: {
  contentType: EncryptedCidContentType
  accessGroup: EncryptedCidAccessGroup
  encryptedCid: string
  encryptedContentIv: string
  encryptedContentSize: number
  wrappedContentKey: WrappedContentKey
  mime?: string
  name?: string
}): EncryptedCidManifest => ({
  kind: ENCRYPTED_CID_KIND,
  version: 1,
  contentType: input.contentType,
  accessGroup: input.accessGroup,
  encryptedContent: {
    cid: input.encryptedCid,
    algorithm: ENCRYPTION_ALGORITHM,
    iv: input.encryptedContentIv,
    size: input.encryptedContentSize,
    mime: input.mime,
    name: input.name
  },
  wrappedContentKey: input.wrappedContentKey,
  createdAt: new Date().toISOString()
})

export const isEncryptedCidManifest = (
  value: unknown
): value is EncryptedCidManifest => {
  const candidate = value as Partial<EncryptedCidManifest> | undefined
  return (
    candidate?.kind === ENCRYPTED_CID_KIND &&
    candidate.version === 1 &&
    candidate.accessGroup?.scopeType != null &&
    candidate.accessGroup.scopeId != null &&
    candidate.encryptedContent?.cid != null &&
    candidate.wrappedContentKey?.ciphertext != null
  )
}

