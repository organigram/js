import { CID_REF_PREFIX, ENCRYPTION_ALGORITHM, FILE_VERSION_MANIFEST_KIND } from './constants';
import { textToBytes } from './encoding';
import { bytesToHex } from 'viem';
const canonicalize = (value) => {
    if (Array.isArray(value)) {
        return value.map(item => canonicalize(item));
    }
    if (value != null && typeof value === 'object') {
        return Object.keys(value)
            .sort((a, b) => a.localeCompare(b))
            .reduce((result, key) => {
            result[key] = canonicalize(value[key]);
            return result;
        }, {});
    }
    return value;
};
export const stableStringify = (value) => JSON.stringify(canonicalize(value));
export const sha256Hex = async (value) => {
    if (globalThis.crypto?.subtle != null) {
        const digest = await globalThis.crypto.subtle.digest('SHA-256', textToBytes(value).buffer);
        return bytesToHex(new Uint8Array(digest)).slice(2);
    }
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(value).digest('hex');
};
/** Create a workspace checkpoint. */
export const createScopeEnvelopeCheckpoint = (input) => ({
    epoch: input.epoch,
    membershipHash: input.membershipHash,
    rootHash: input.rootHash
});
/**
 * Build a CID reference, `og://workspace/<workspace>/<key>`, optionally pinned to one version.
 *
 * @example
 * ```ts
 * formatCidRef({ scopeType: 'workspace', scopeId: workspaceId }, 'bylaws')
 * ```
 */
export const formatCidRef = (scopeRef, logicalKey, manifestCid) => {
    if (scopeRef.scopeType !== 'workspace') {
        throw new Error('Only workspace scope references are supported.');
    }
    if (scopeRef.scopeId === '' || logicalKey === '') {
        throw new Error('scopeId and logicalKey are required to format a CID ref.');
    }
    const reference = `${CID_REF_PREFIX}${encodeURIComponent(scopeRef.scopeId)}/${encodeURIComponent(logicalKey)}`;
    return manifestCid == null || manifestCid === ''
        ? reference
        : `${reference}?version=${encodeURIComponent(manifestCid)}`;
};
/** Split a CID reference into its parts, or return `null` if it is not one. */
export const parseCidRef = (value) => {
    if (value == null || !value.startsWith(CID_REF_PREFIX)) {
        return null;
    }
    const [path, query] = value.slice(CID_REF_PREFIX.length).split('?', 2);
    const parts = path.split('/');
    if (parts.length < 2) {
        return null;
    }
    const [encodedScopeId, ...encodedLogicalKey] = parts;
    const scopeId = decodeURIComponent(encodedScopeId ?? '');
    const logicalKey = decodeURIComponent(encodedLogicalKey.join('/'));
    if (scopeId === '' || logicalKey === '') {
        return null;
    }
    const manifestCid = new URLSearchParams(query).get('version') ?? undefined;
    return {
        scopeRef: {
            scopeType: 'workspace',
            scopeId
        },
        logicalKey,
        ...(manifestCid != null && manifestCid !== '' ? { manifestCid } : {})
    };
};
/** Tell whether a string is a CID reference. */
export const isCidRef = (value) => parseCidRef(value) != null;
/** Describe the current version of one file for a workspace checkpoint. */
export const createScopeEnvelopeItem = (input) => ({
    logicalKey: input.logicalKey,
    currentManifestCid: input.currentManifestCid,
    contentType: input.contentType,
    version: input.version ?? 1,
    retentionState: input.retentionState ?? 'current',
    previousManifestCid: input.previousManifestCid,
    updatedAt: input.updatedAt instanceof Date
        ? input.updatedAt.toISOString()
        : input.updatedAt ?? new Date().toISOString()
});
/** Hash every file entry of a workspace into the root hash of a checkpoint. */
export const computeScopeEnvelopeRoot = async (items) => {
    const sortedItems = Object.keys(items)
        .sort((a, b) => a.localeCompare(b))
        .map(key => [key, items[key]]);
    return await sha256Hex(stableStringify(sortedItems));
};
/** Build the message a member signs to vouch for a workspace checkpoint. */
export const createScopeEnvelopeSignatureMessage = (input) => [
    'Organigram scope envelope checkpoint',
    `scopeType: ${input.scopeRef.scopeType}`,
    `scopeId: ${input.scopeRef.scopeId}`,
    `epoch: ${input.checkpoint.epoch}`,
    `membershipHash: ${input.checkpoint.membershipHash}`,
    `rootHash: ${input.checkpoint.rootHash}`,
    `items: ${stableStringify(Object.keys(input.items)
        .sort((a, b) => a.localeCompare(b))
        .map(key => [key, input.items[key]]))}`,
    `previousEnvelopeCid: ${input.previousEnvelopeCid ?? ''}`
].join('\n');
/** Describe a new version of an encrypted file. */
export const createFileVersionManifest = (input) => ({
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
    createdAt: input.createdAt instanceof Date
        ? input.createdAt.toISOString()
        : input.createdAt ?? new Date().toISOString()
});
/** Describe a new version of a file stored in clear. */
export const createPublicFileVersionManifest = (input) => ({
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
    createdAt: input.createdAt instanceof Date
        ? input.createdAt.toISOString()
        : input.createdAt ?? new Date().toISOString()
});
