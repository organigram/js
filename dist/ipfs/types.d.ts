import type { ENCRYPTED_CID_KIND, ENCRYPTION_ALGORITHM, ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND, GROUP_KEY_ALGORITHM, USER_ENCRYPTION_KEY_BACKUP_KIND } from './constants';
export type AccessGroupScopeType = 'workspace' | 'organization' | 'organ' | 'procedure' | 'certifiedProof';
export type EncryptedCidContentType = 'entry' | 'proposal' | 'organMetadata' | 'procedureMetadata' | 'certifiedProof' | 'file' | string;
export interface EncryptedCidAccessGroup {
    scopeType: AccessGroupScopeType;
    scopeId: string;
    epoch: number;
}
export interface WrappedGroupKey {
    algorithm: typeof GROUP_KEY_ALGORITHM;
    recipientAddress: string;
    recipientKeyVersion: number;
    ephemeralPublicKey: JsonWebKey;
    iv: string;
    ciphertext: string;
}
export interface WrappedContentKey {
    algorithm: typeof ENCRYPTION_ALGORITHM;
    iv: string;
    ciphertext: string;
}
export interface EncryptedCidManifest {
    kind: typeof ENCRYPTED_CID_KIND;
    version: 1;
    contentType: EncryptedCidContentType;
    accessGroup: EncryptedCidAccessGroup;
    encryptedContent: {
        cid: string;
        algorithm: typeof ENCRYPTION_ALGORITHM;
        iv: string;
        size: number;
        mime?: string;
        name?: string;
    };
    wrappedContentKey: WrappedContentKey;
    createdAt: string;
}
export interface RecipientEncryptionKey {
    address: string;
    publicKey: JsonWebKey;
    keyVersion: number;
}
export interface StoredUserEncryptionKeyPair {
    keyPair: CryptoKeyPair;
    publicKey: JsonWebKey;
    keyVersion: number;
}
export interface EncryptionPublicKeySiweResource {
    kind: typeof ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND;
    address: string;
    publicKey: JsonWebKey;
    keyVersion: number;
}
export interface UserEncryptionKeyBackup {
    kind: typeof USER_ENCRYPTION_KEY_BACKUP_KIND;
    address: string;
    publicKey: JsonWebKey;
    keyVersion: number;
    privateKey: {
        algorithm: 'PBKDF2-SHA256+A256GCM';
        iterations: number;
        salt: string;
        iv: string;
        ciphertext: string;
    };
    createdAt: string;
}
