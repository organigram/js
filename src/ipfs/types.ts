import type {
  ENCRYPTED_CID_KIND,
  ENCRYPTION_ALGORITHM,
  ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND,
  GROUP_KEY_ALGORITHM,
  FILE_VERSION_MANIFEST_KIND,
  SCOPE_ENVELOPE_KIND,
  USER_ENCRYPTION_KEY_BACKUP_KIND
} from './constants'

export type AccessGroupScopeType =
  | 'workspace'
  | 'organization'
  | 'organ'
  | 'procedure'
  | 'certifiedProof'

export type EncryptedCidContentType =
  | 'entry'
  | 'proposal'
  | 'organMetadata'
  | 'procedureMetadata'
  | 'certifiedProof'
  | 'file'
  | string

export type ScopeEnvelopeScopeType = 'workspace'

export type ScopeEnvelopeContentType = EncryptedCidContentType

export type ScopeEnvelopeRetentionState =
  | 'current'
  | 'superseded'
  | 'revoked'
  | 'archived'

export interface ScopeEnvelopeReference {
  scopeType: ScopeEnvelopeScopeType
  scopeId: string
}

export interface ParsedCidRef {
  scopeRef: ScopeEnvelopeReference
  logicalKey: string
}

export interface EncryptedCidAccessGroup {
  scopeType: AccessGroupScopeType
  scopeId: string
  epoch: number
}

export interface WrappedGroupKey {
  algorithm: typeof GROUP_KEY_ALGORITHM
  recipientAddress: string
  recipientKeyVersion: number
  ephemeralPublicKey: JsonWebKey
  iv: string
  ciphertext: string
}

export interface WrappedContentKey {
  algorithm: typeof ENCRYPTION_ALGORITHM
  iv: string
  ciphertext: string
}

export interface ScopeEnvelopeCheckpoint {
  epoch: number
  membershipHash: string
  rootHash: string
}

export interface ScopeEnvelopeItem {
  logicalKey: string
  currentManifestCid: string
  contentType: ScopeEnvelopeContentType
  version: number
  retentionState: ScopeEnvelopeRetentionState
  previousManifestCid?: string
  updatedAt: string
}

export interface ScopeEnvelopeManifest {
  kind: typeof SCOPE_ENVELOPE_KIND
  version: 1
  scopeRef: ScopeEnvelopeReference
  checkpoint: ScopeEnvelopeCheckpoint
  items: Record<string, ScopeEnvelopeItem>
  wrappedEnvelopeKey: WrappedContentKey
  previousEnvelopeCid?: string
  signature?: string
  signedByAddress?: string
  createdAt: string
}

export interface PublicFileVersionManifest {
  kind: typeof FILE_VERSION_MANIFEST_KIND
  version: 1
  contentType: ScopeEnvelopeContentType
  accessGroup?: EncryptedCidAccessGroup
  scopeRef?: ScopeEnvelopeReference
  logicalKey?: string
  retentionState?: ScopeEnvelopeRetentionState
  previousManifestCid?: string
  publicContent: {
    cid: string
    size: number
    mime?: string
    name?: string
  }
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  signature?: string
  signedByAddress?: string
  createdAt: string
}

export interface EncryptedCidManifest {
  kind: typeof ENCRYPTED_CID_KIND | typeof FILE_VERSION_MANIFEST_KIND
  version: 1
  contentType: ScopeEnvelopeContentType
  accessGroup?: EncryptedCidAccessGroup
  scopeRef?: ScopeEnvelopeReference
  logicalKey?: string
  retentionState?: ScopeEnvelopeRetentionState
  previousManifestCid?: string
  encryptedContent: {
    cid: string
    algorithm: typeof ENCRYPTION_ALGORITHM
    iv: string
    size: number
    mime?: string
    name?: string
  }
  wrappedContentKey: WrappedContentKey
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  signature?: string
  signedByAddress?: string
  createdAt: string
}

export type FileVersionManifest =
  | PublicFileVersionManifest
  | EncryptedCidManifest

export interface RecipientEncryptionKey {
  address: string
  publicKey: JsonWebKey
  keyVersion: number
}

export interface StoredUserEncryptionKeyPair {
  keyPair: CryptoKeyPair
  publicKey: JsonWebKey
  keyVersion: number
}

export interface EncryptionPublicKeySiweResource {
  kind: typeof ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND
  address: string
  publicKey: JsonWebKey
  keyVersion: number
}

export interface UserEncryptionKeyBackup {
  kind: typeof USER_ENCRYPTION_KEY_BACKUP_KIND
  address: string
  publicKey: JsonWebKey
  keyVersion: number
  privateKey: {
    algorithm: 'PBKDF2-SHA256+A256GCM'
    iterations: number
    salt: string
    iv: string
    ciphertext: string
  }
  createdAt: string
}
