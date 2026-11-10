import type { FileVersionManifest, ParsedCidRef, PublicFileVersionManifest, ScopeEnvelopeCheckpoint, ScopeEnvelopeContentType, ScopeEnvelopeItem, ScopeEnvelopeReference, ScopeEnvelopeRetentionState, WrappedContentKey } from './types';
export declare const stableStringify: (value: unknown) => string;
export declare const sha256Hex: (value: string) => Promise<string>;
/** Create a workspace checkpoint. */
export declare const createScopeEnvelopeCheckpoint: (input: {
    epoch: number;
    membershipHash: string;
    rootHash: string;
}) => ScopeEnvelopeCheckpoint;
/**
 * Build a CID reference, `og://workspace/<workspace>/<key>`, optionally pinned to one version.
 *
 * @example
 * ```ts
 * formatCidRef({ scopeType: 'workspace', scopeId: workspaceId }, 'bylaws')
 * ```
 */
export declare const formatCidRef: (scopeRef: ScopeEnvelopeReference, logicalKey: string, manifestCid?: string) => string;
/** Split a CID reference into its parts, or return `null` if it is not one. */
export declare const parseCidRef: (value?: string | null) => ParsedCidRef | null;
/** Tell whether a string is a CID reference. */
export declare const isCidRef: (value?: string | null) => boolean;
/** Describe the current version of one file for a workspace checkpoint. */
export declare const createScopeEnvelopeItem: (input: {
    logicalKey: string;
    currentManifestCid: string;
    contentType: ScopeEnvelopeContentType;
    version?: number;
    retentionState?: ScopeEnvelopeRetentionState;
    previousManifestCid?: string;
    updatedAt?: Date | string;
}) => ScopeEnvelopeItem;
/** Hash every file entry of a workspace into the root hash of a checkpoint. */
export declare const computeScopeEnvelopeRoot: (items: Record<string, ScopeEnvelopeItem>) => Promise<string>;
/** Build the message a member signs to vouch for a workspace checkpoint. */
export declare const createScopeEnvelopeSignatureMessage: (input: {
    scopeRef: ScopeEnvelopeReference;
    checkpoint: ScopeEnvelopeCheckpoint;
    items: Record<string, ScopeEnvelopeItem>;
    previousEnvelopeCid?: string | null;
}) => string;
/** Describe a new version of an encrypted file. */
export declare const createFileVersionManifest: (input: {
    contentType: ScopeEnvelopeContentType;
    scopeRef: ScopeEnvelopeReference;
    logicalKey: string;
    encryptedCid: string;
    encryptedContentIv: string;
    encryptedContentSize: number;
    wrappedContentKey: WrappedContentKey;
    previousManifestCid?: string | null;
    retentionState?: ScopeEnvelopeRetentionState;
    scopeEnvelope?: ScopeEnvelopeCheckpoint;
    mime?: string;
    name?: string;
    signature?: string | null;
    signedByAddress?: string | null;
    createdAt?: Date | string;
}) => FileVersionManifest;
/** Describe a new version of a file stored in clear. */
export declare const createPublicFileVersionManifest: (input: {
    contentType: ScopeEnvelopeContentType;
    scopeRef: ScopeEnvelopeReference;
    logicalKey: string;
    publicCid: string;
    publicContentSize: number;
    previousManifestCid?: string | null;
    retentionState?: ScopeEnvelopeRetentionState;
    scopeEnvelope?: ScopeEnvelopeCheckpoint;
    mime?: string;
    name?: string;
    signature?: string | null;
    signedByAddress?: string | null;
    createdAt?: Date | string;
}) => PublicFileVersionManifest;
