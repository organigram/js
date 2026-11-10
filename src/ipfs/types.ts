import type {
  ENCRYPTED_CID_KIND,
  ENCRYPTION_ALGORITHM,
  ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND,
  GROUP_KEY_ALGORITHM,
  FILE_VERSION_MANIFEST_KIND
} from './constants'

/** What an access group is scoped to: its members share one group key. */
export type AccessGroupScopeType =
  | 'workspace'
  | 'organization'
  | 'organ'
  | 'procedure'
  | 'certifiedProof'

/** What a stored file holds, such as an organ entry or a proposal. */
export type EncryptedCidContentType =
  | 'entry'
  | 'proposal'
  | 'organMetadata'
  | 'procedureMetadata'
  | 'certifiedProof'
  | 'file'
  | string

/** Scope of a CID reference. Only workspaces are supported. */
export type ScopeEnvelopeScopeType = 'workspace'

/** What the file behind a CID reference holds. */
export type ScopeEnvelopeContentType = EncryptedCidContentType

/**
 * Lifecycle of a file version: current, replaced by a newer one, revoked or archived.
 */
export type ScopeEnvelopeRetentionState =
  | 'current'
  | 'superseded'
  | 'revoked'
  | 'archived'

/** The workspace a CID reference belongs to. */
export interface ScopeEnvelopeReference {
  /** Kind of scope, always `workspace`. */
  scopeType: ScopeEnvelopeScopeType
  /** Workspace identifier. */
  scopeId: string
}

/** A CID reference split into its parts by `parseCidRef()`. */
export interface ParsedCidRef {
  /** Workspace the file belongs to. */
  scopeRef: ScopeEnvelopeReference
  /** Stable name of the file within its workspace, whatever its version. */
  logicalKey: string
  /** Pins the reference to one immutable file-version manifest when present. */
  manifestCid?: string
}

/** The group whose members can decrypt a file. */
export interface EncryptedCidAccessGroup {
  /** What the group is scoped to. */
  scopeType: AccessGroupScopeType
  /** Identifier of that workspace, organization, organ or procedure. */
  scopeId: string
  /** Group key generation, increased when membership changes. */
  epoch: number
}

/**
 * A group key encrypted for one member, which only their private key can unwrap.
 */
export interface WrappedGroupKey {
  /** Wrapping algorithm. */
  algorithm: typeof GROUP_KEY_ALGORITHM
  /** Ethereum address of the member. */
  recipientAddress: string
  /** Version of the member key pair used. */
  recipientKeyVersion: number
  /** One-time public key used for the key agreement. */
  ephemeralPublicKey: JsonWebKey
  /** Initialization vector, in base64. */
  iv: string
  /** Encrypted group key, in base64. */
  ciphertext: string
}

/** A content key encrypted with a group key. */
export interface WrappedContentKey {
  /** Wrapping algorithm. */
  algorithm: typeof ENCRYPTION_ALGORITHM
  /** Initialization vector, in base64. */
  iv: string
  /** Encrypted content key, in base64. */
  ciphertext: string
}

/** A signed summary of every file of a workspace at one point in time. */
export interface ScopeEnvelopeCheckpoint {
  /** Access group generation at that time. */
  epoch: number
  /** Hash of the members who had access. */
  membershipHash: string
  /** Hash of every file entry, from `computeScopeEnvelopeRoot()`. */
  rootHash: string
}

/** The current version of one file in a workspace checkpoint. */
export interface ScopeEnvelopeItem {
  /** Stable name of the file. */
  logicalKey: string
  /** CID of the manifest of its current version. */
  currentManifestCid: string
  /** What the file holds. */
  contentType: ScopeEnvelopeContentType
  /** Version number, starting at 1. */
  version: number
  /** Lifecycle state of this version. */
  retentionState: ScopeEnvelopeRetentionState
  /** CID of the manifest of the previous version. */
  previousManifestCid?: string
  /** ISO date of the last change. */
  updatedAt: string
}

/** Describes one version of a file stored in clear on IPFS. */
export interface PublicFileVersionManifest {
  /** Manifest format. */
  kind: typeof FILE_VERSION_MANIFEST_KIND
  /** Manifest format version. */
  version: 1
  /** What the file holds. */
  contentType: ScopeEnvelopeContentType
  /** Group the file is shared with, if any. */
  accessGroup?: EncryptedCidAccessGroup
  /** Workspace the file belongs to. */
  scopeRef?: ScopeEnvelopeReference
  /** Stable name of the file. */
  logicalKey?: string
  /** Lifecycle state of this version. */
  retentionState?: ScopeEnvelopeRetentionState
  /** CID of the manifest of the previous version. */
  previousManifestCid?: string
  /** CID, size, type and name of the content. */
  publicContent: {
    cid: string
    size: number
    mime?: string
    name?: string
  }
  /** Workspace checkpoint this version belongs to. */
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  /** Signature of the author over the manifest. */
  signature?: string
  /** Address of the author. */
  signedByAddress?: string
  /** ISO creation date. */
  createdAt: string
}

/**
 * Describes one version of an encrypted file: where its ciphertext is and how to get its key.
 */
export interface EncryptedCidManifest {
  /** Manifest format. */
  kind: typeof ENCRYPTED_CID_KIND | typeof FILE_VERSION_MANIFEST_KIND
  /** Manifest format version. */
  version: 1
  /** What the file holds. */
  contentType: ScopeEnvelopeContentType
  /** Group whose key unwraps the content key. */
  accessGroup?: EncryptedCidAccessGroup
  /** Workspace the file belongs to. */
  scopeRef?: ScopeEnvelopeReference
  /** Stable name of the file. */
  logicalKey?: string
  /** Lifecycle state of this version. */
  retentionState?: ScopeEnvelopeRetentionState
  /** CID of the manifest of the previous version. */
  previousManifestCid?: string
  /**
   * CID, algorithm, initialization vector, size, type and name of the ciphertext.
   */
  encryptedContent: {
    cid: string
    algorithm: typeof ENCRYPTION_ALGORITHM
    iv: string
    size: number
    mime?: string
    name?: string
  }
  /** Content key, encrypted with the group key. */
  wrappedContentKey: WrappedContentKey
  /** Workspace checkpoint this version belongs to. */
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  /** Signature of the author over the manifest. */
  signature?: string
  /** Address of the author. */
  signedByAddress?: string
  /** ISO creation date. */
  createdAt: string
}

/** One version of a stored file, public or encrypted. */
export type FileVersionManifest =
  | PublicFileVersionManifest
  | EncryptedCidManifest

/** The public encryption key of a member, used to wrap a group key for them. */
export interface RecipientEncryptionKey {
  /** Ethereum address of the member. */
  address: string
  /** Public key, as a JSON Web Key. */
  publicKey: JsonWebKey
  /** Version of the key pair. */
  keyVersion: number
}

/** The encryption key pair of the current user, as kept on their device. */
export interface StoredUserEncryptionKeyPair {
  /** Web Crypto key pair. */
  keyPair: CryptoKeyPair
  /** Public key, as a JSON Web Key. */
  publicKey: JsonWebKey
  /** Version of the key pair. */
  keyVersion: number
}

/** An encryption public key read from a Sign-In with Ethereum message. */
export interface EncryptionPublicKeySiweResource {
  /** Resource format. */
  kind: typeof ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND
  /** Address that signed in. */
  address: string
  /** Public key, as a JSON Web Key. */
  publicKey: JsonWebKey
  /** Version of the key pair. */
  keyVersion: number
}
