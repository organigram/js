import type { EncryptedCidAccessGroup, EncryptedCidContentType, EncryptedCidManifest, WrappedContentKey } from './types';
export declare const createEncryptedCidManifest: (input: {
    contentType: EncryptedCidContentType;
    accessGroup: EncryptedCidAccessGroup;
    encryptedCid: string;
    encryptedContentIv: string;
    encryptedContentSize: number;
    wrappedContentKey: WrappedContentKey;
    mime?: string;
    name?: string;
}) => EncryptedCidManifest;
export declare const isEncryptedCidManifest: (value: unknown) => value is EncryptedCidManifest;
