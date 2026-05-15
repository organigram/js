import { ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND, ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_PREFIX } from './constants';
import { base64UrlToBytes, bytesToBase64Url, bytesToText, textToBytes } from './encoding';
import { normalizeEncryptionKeyVersion } from './keyVersion';
export const createEncryptionPublicKeyMessage = (address, publicKey, keyVersion) => [
    'Organigram encryption public key registration',
    `Address: ${address.toLowerCase()}`,
    `Key version: ${keyVersion}`,
    `Public key: ${JSON.stringify(publicKey)}`
].join('\n');
export const createEncryptionPublicKeySiweResource = (address, publicKey, keyVersion) => {
    const payload = {
        kind: ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND,
        address: address.toLowerCase(),
        publicKey,
        keyVersion
    };
    return `${ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_PREFIX}${bytesToBase64Url(textToBytes(JSON.stringify(payload)))}`;
};
export const parseEncryptionPublicKeySiweResource = (resources, address) => {
    const resource = resources?.find(resource => resource.startsWith(ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_PREFIX));
    if (resource == null)
        return null;
    try {
        const payload = JSON.parse(bytesToText(base64UrlToBytes(resource.substring(ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_PREFIX.length))));
        if (payload.kind !== ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND ||
            payload.address?.toLowerCase() !== address.toLowerCase() ||
            payload.publicKey == null ||
            typeof payload.keyVersion !== 'number') {
            return null;
        }
        if (normalizeEncryptionKeyVersion(payload.keyVersion) !== payload.keyVersion) {
            return null;
        }
        return {
            kind: ENCRYPTION_PUBLIC_KEY_SIWE_RESOURCE_KIND,
            address: payload.address.toLowerCase(),
            publicKey: payload.publicKey,
            keyVersion: payload.keyVersion
        };
    }
    catch {
        return null;
    }
};
