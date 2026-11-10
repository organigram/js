import type { EncryptedCidManifest, FileVersionManifest, PublicFileVersionManifest } from './types';
/** Tell whether a value is the manifest of an encrypted file. */
export declare const isEncryptedCidManifest: (value: unknown) => value is EncryptedCidManifest;
export declare const isPublicFileVersionManifest: (value: unknown) => value is PublicFileVersionManifest;
/** Tell whether a value is a file-version manifest, public or encrypted. */
export declare const isFileVersionManifest: (value: unknown) => value is FileVersionManifest;
