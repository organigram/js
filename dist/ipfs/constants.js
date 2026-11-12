/**
 * `kind` of manifests written before file versioning, still read for compatibility.
 */
export const ENCRYPTED_CID_KIND = 'organigram.encrypted-cid.v1';
/** `kind` of a file-version manifest, public or encrypted. */
export const FILE_VERSION_MANIFEST_KIND = 'organigram.file-version-manifest.v1';
export const CID_REF_PREFIX = 'og://workspace/';
/** Symmetric algorithm used for content and content keys: AES-256-GCM. */
export const ENCRYPTION_ALGORITHM = 'A256GCM';
/**
 * Algorithm used to wrap a group key for one member: ECDH on P-256, then AES-256-GCM.
 */
export const GROUP_KEY_ALGORITHM = 'ECDH-P256+A256GCM';
/**
 * `kind` of the encryption public key a user publishes in a Sign-In with Ethereum message.
 */
export const ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND = 'organigram.encryption-public-key.v1';
export const ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_PREFIX = 'urn:organigram:encryption-public-key:';
