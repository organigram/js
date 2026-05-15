import { ENCRYPTED_CID_KIND, ENCRYPTION_ALGORITHM } from './constants';
export const createEncryptedCidManifest = (input) => ({
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
});
export const isEncryptedCidManifest = (value) => {
    const candidate = value;
    return (candidate?.kind === ENCRYPTED_CID_KIND &&
        candidate.version === 1 &&
        candidate.accessGroup?.scopeType != null &&
        candidate.accessGroup.scopeId != null &&
        candidate.encryptedContent?.cid != null &&
        candidate.wrappedContentKey?.ciphertext != null);
};
