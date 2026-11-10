import { ENCRYPTED_CID_KIND, FILE_VERSION_MANIFEST_KIND } from './constants';
/** Tell whether a value is the manifest of an encrypted file. */
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
/** Tell whether a value is a file-version manifest, public or encrypted. */
export const isFileVersionManifest = (value) => isEncryptedCidManifest(value) || isPublicFileVersionManifest(value);
