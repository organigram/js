import {
  CID_REF_PREFIX,
  ENCRYPTION_ALGORITHM,
  FILE_VERSION_MANIFEST_KIND,
  SCOPE_ENVELOPE_KIND
} from './constants'
import { textToBytes } from './encoding'
import { bytesToHex } from 'viem'
import type {
  FileVersionManifest,
  ParsedCidRef,
  PublicFileVersionManifest,
  ScopeEnvelopeCheckpoint,
  ScopeEnvelopeContentType,
  ScopeEnvelopeItem,
  ScopeEnvelopeManifest,
  ScopeEnvelopeReference,
  ScopeEnvelopeRetentionState,
  WrappedContentKey
} from './types'

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => canonicalize(item))
  }

  if (value != null && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = canonicalize((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  return value
}

export const stableStringify = (value: unknown): string =>
  JSON.stringify(canonicalize(value))

export const sha256Hex = async (value: string): Promise<string> => {
  if (globalThis.crypto?.subtle != null) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      textToBytes(value).buffer as ArrayBuffer
    )
    return bytesToHex(new Uint8Array(digest)).slice(2)
  }

  const { createHash } = await import('node:crypto')
  return createHash('sha256').update(value).digest('hex')
}

export const createScopeEnvelopeCheckpoint = (input: {
  epoch: number
  membershipHash: string
  rootHash: string
}): ScopeEnvelopeCheckpoint => ({
  epoch: input.epoch,
  membershipHash: input.membershipHash,
  rootHash: input.rootHash
})

export const formatCidRef = (
  scopeRef: ScopeEnvelopeReference,
  logicalKey: string
): string => {
  if (scopeRef.scopeType !== 'workspace') {
    throw new Error('Only workspace scope references are supported.')
  }
  if (scopeRef.scopeId === '' || logicalKey === '') {
    throw new Error('scopeId and logicalKey are required to format a CID ref.')
  }
  return `${CID_REF_PREFIX}${encodeURIComponent(scopeRef.scopeId)}/${encodeURIComponent(logicalKey)}`
}

export const parseCidRef = (value?: string | null): ParsedCidRef | null => {
  if (value == null || !value.startsWith(CID_REF_PREFIX)) {
    return null
  }
  const parts = value.slice(CID_REF_PREFIX.length).split('/')
  if (parts.length < 2) {
    return null
  }
  const [encodedScopeId, ...encodedLogicalKey] = parts
  const scopeId = decodeURIComponent(encodedScopeId ?? '')
  const logicalKey = decodeURIComponent(encodedLogicalKey.join('/'))
  if (scopeId === '' || logicalKey === '') {
    return null
  }
  return {
    scopeRef: {
      scopeType: 'workspace',
      scopeId
    },
    logicalKey
  }
}

export const isCidRef = (value?: string | null): boolean =>
  parseCidRef(value) != null

export const createScopeEnvelopeItem = (input: {
  logicalKey: string
  currentManifestCid: string
  contentType: ScopeEnvelopeContentType
  version?: number
  retentionState?: ScopeEnvelopeRetentionState
  previousManifestCid?: string
  updatedAt?: Date | string
}): ScopeEnvelopeItem => ({
  logicalKey: input.logicalKey,
  currentManifestCid: input.currentManifestCid,
  contentType: input.contentType,
  version: input.version ?? 1,
  retentionState: input.retentionState ?? 'current',
  previousManifestCid: input.previousManifestCid,
  updatedAt:
    input.updatedAt instanceof Date
      ? input.updatedAt.toISOString()
      : input.updatedAt ?? new Date().toISOString()
})

export const computeScopeEnvelopeRoot = async (
  items: Record<string, ScopeEnvelopeItem>
): Promise<string> => {
  const sortedItems = Object.keys(items)
    .sort((a, b) => a.localeCompare(b))
    .map(key => [key, items[key]])
  return await sha256Hex(stableStringify(sortedItems))
}

export const createScopeEnvelopeSignatureMessage = (input: {
  scopeRef: ScopeEnvelopeReference
  checkpoint: ScopeEnvelopeCheckpoint
  items: Record<string, ScopeEnvelopeItem>
  previousEnvelopeCid?: string | null
}): string =>
  [
    'Organigram scope envelope checkpoint',
    `scopeType: ${input.scopeRef.scopeType}`,
    `scopeId: ${input.scopeRef.scopeId}`,
    `epoch: ${input.checkpoint.epoch}`,
    `membershipHash: ${input.checkpoint.membershipHash}`,
    `rootHash: ${input.checkpoint.rootHash}`,
    `items: ${stableStringify(
      Object.keys(input.items)
        .sort((a, b) => a.localeCompare(b))
        .map(key => [key, input.items[key]])
    )}`,
    `previousEnvelopeCid: ${input.previousEnvelopeCid ?? ''}`
  ].join('\n')

export const createScopeEnvelopeManifest = (input: {
  scopeRef: ScopeEnvelopeReference
  checkpoint: ScopeEnvelopeCheckpoint
  items: Record<string, ScopeEnvelopeItem>
  wrappedEnvelopeKey: WrappedContentKey
  previousEnvelopeCid?: string | null
  signature?: string | null
  signedByAddress?: string | null
  createdAt?: Date | string
}): ScopeEnvelopeManifest => ({
  kind: SCOPE_ENVELOPE_KIND,
  version: 1,
  scopeRef: input.scopeRef,
  checkpoint: input.checkpoint,
  items: input.items,
  wrappedEnvelopeKey: input.wrappedEnvelopeKey,
  previousEnvelopeCid: input.previousEnvelopeCid ?? undefined,
  signature: input.signature ?? undefined,
  signedByAddress: input.signedByAddress?.toLowerCase(),
  createdAt:
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString()
})

export const isScopeEnvelopeManifest = (
  value: unknown
): value is ScopeEnvelopeManifest => {
  const candidate = value as Partial<ScopeEnvelopeManifest> | undefined
  return (
    candidate?.kind === SCOPE_ENVELOPE_KIND &&
    candidate.version === 1 &&
    candidate.scopeRef?.scopeType === 'workspace' &&
    candidate.scopeRef.scopeId != null &&
    candidate.checkpoint?.rootHash != null &&
    candidate.wrappedEnvelopeKey?.ciphertext != null
  )
}

export const createFileVersionManifest = (input: {
  contentType: ScopeEnvelopeContentType
  scopeRef: ScopeEnvelopeReference
  logicalKey: string
  encryptedCid: string
  encryptedContentIv: string
  encryptedContentSize: number
  wrappedContentKey: WrappedContentKey
  previousManifestCid?: string | null
  retentionState?: ScopeEnvelopeRetentionState
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  mime?: string
  name?: string
  signature?: string | null
  signedByAddress?: string | null
  createdAt?: Date | string
}): FileVersionManifest => ({
  kind: FILE_VERSION_MANIFEST_KIND,
  version: 1,
  contentType: input.contentType,
  scopeRef: input.scopeRef,
  logicalKey: input.logicalKey,
  retentionState: input.retentionState ?? 'current',
  previousManifestCid: input.previousManifestCid ?? undefined,
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
  signature: input.signature ?? undefined,
  signedByAddress: input.signedByAddress?.toLowerCase(),
  createdAt:
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString()
})

export const createPublicFileVersionManifest = (input: {
  contentType: ScopeEnvelopeContentType
  scopeRef: ScopeEnvelopeReference
  logicalKey: string
  publicCid: string
  publicContentSize: number
  previousManifestCid?: string | null
  retentionState?: ScopeEnvelopeRetentionState
  scopeEnvelope?: ScopeEnvelopeCheckpoint
  mime?: string
  name?: string
  signature?: string | null
  signedByAddress?: string | null
  createdAt?: Date | string
}): PublicFileVersionManifest => ({
  kind: FILE_VERSION_MANIFEST_KIND,
  version: 1,
  contentType: input.contentType,
  scopeRef: input.scopeRef,
  logicalKey: input.logicalKey,
  retentionState: input.retentionState ?? 'current',
  previousManifestCid: input.previousManifestCid ?? undefined,
  publicContent: {
    cid: input.publicCid,
    size: input.publicContentSize,
    mime: input.mime,
    name: input.name
  },
  scopeEnvelope: input.scopeEnvelope,
  signature: input.signature ?? undefined,
  signedByAddress: input.signedByAddress?.toLowerCase(),
  createdAt:
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : input.createdAt ?? new Date().toISOString()
})
