import { ENCRYPTED_CID_KIND, ENCRYPTION_ALGORITHM, FILE_VERSION_MANIFEST_KIND } from './constants';
export const createEncryptedCidManifest = (input) => ({
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
});
export const isEncryptedCidManifest = (value) => {
    const candidate = value;
    return ((candidate?.kind === ENCRYPTED_CID_KIND ||
        candidate?.kind === FILE_VERSION_MANIFEST_KIND) &&
        candidate.version === 1 &&
        candidate.encryptedContent?.cid != null &&
        candidate.wrappedContentKey?.ciphertext != null);
};
export const isPublicFileVersionManifest = (value) => {
    const candidate = value;
    return (candidate?.kind === FILE_VERSION_MANIFEST_KIND &&
        candidate.version === 1 &&
        candidate.publicContent?.cid != null);
};
export const isFileVersionManifest = (value) => isEncryptedCidManifest(value) || isPublicFileVersionManifest(value);
