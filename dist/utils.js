import deployedAddresses, { getChainExplorerBaseUrl, getConfiguredChain, getDefaultChainId, getDeployment, getHostUrl, getSupportedChainIds, getSupportedChains, isSupportedChainId, isLocalHost, resolveDeployment } from './deployments';
import { bytesToHex, encodeAbiParameters, getCreate2Address, keccak256, padHex, toHex } from 'viem';
export { deployedAddresses, getChainExplorerBaseUrl, getConfiguredChain, getDefaultChainId, getDeployment, getHostUrl, getSupportedChainIds, getSupportedChains, isSupportedChainId, isLocalHost, resolveDeployment };
/** A `JSON.stringify` replacer that writes bigints as strings ending in `n`. */
export const handleJsonBigInt = (_key, value) => {
    if (typeof value === 'bigint') {
        return value.toString() + 'n';
    }
    return value;
};
export function cloneInitCodeHash(implementation) {
    const impl = implementation?.toLowerCase()?.replace(/^0x/, '');
    const initCode = '0x3d602d80600a3d3981f3' +
        '363d3d373d3d3d363d73' +
        impl +
        '5af43d82803e903d91602b57fd5bf3';
    return keccak256(initCode);
}
/**
 * Predict the address of a clone deployed by the OrganigramClient.
 *
 * The client binds each salt to the account deploying the clone, so only an
 * address predicted with `deployer` is the address the clone will have.
 * Without it, the result is merely a unique placeholder for a draft.
 */
export const predictContractAddress = ({ type, chainId, salt, deployer }) => {
    const normalizedSalt = /^0x[0-9a-fA-F]{64}$/.test(salt)
        ? salt
        : padHex(toHex(salt), { size: 32 });
    return getCreate2Address({
        from: getDeployment(chainId, 'OrganigramClient'),
        salt: deployer == null
            ? normalizedSalt
            : keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'bytes32' }], [deployer, normalizedSalt])),
        bytecodeHash: cloneInitCodeHash(type === 'Organ'
            ? getDeployment(chainId, 'CloneableOrgan')
            : type === 'Asset'
                ? getDeployment(chainId, 'CloneableAsset')
                : type === 'EquityToken'
                    ? getDeployment(chainId, 'EquityToken')
                    : getDeployment(chainId, type.replace('Erc', 'ERC')))
    });
};
/** Generate a random 32-byte hex string, for example a salt. */
export const createRandom32BytesHexId = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
export const formatSalt = (salt) => {
    if (salt == null) {
        return createRandom32BytesHexId();
    }
    else if (salt.length === 0 ||
        !salt.startsWith('0x') ||
        salt.length !== 66) {
        throw new Error('Invalid salt: ' +
            salt +
            'Salt must be a 32 bytes hex string prefixed with 0x');
    }
    else
        return salt;
};
// Organ permissions granted to procedures
/**
 * Bit flags of the permissions an address can hold on an organ. Combine them with `|`.
 *
 * @example
 * ```ts
 * PERMISSIONS.ADD_ENTRIES | PERMISSIONS.REMOVE_ENTRIES
 * ```
 */
export const PERMISSIONS = {
    ADMIN: 0xffff,
    ALL: 0x1fff,
    ALL_PERMISSIONS: 0x0003,
    ALL_ENTRIES: 0x000c,
    ADD_PERMISSIONS: 0x0001,
    REMOVE_PERMISSIONS: 0x0002,
    ADD_ENTRIES: 0x0004,
    REMOVE_ENTRIES: 0x0008,
    UPDATE_METADATA: 0x0010,
    // 0x0020, 0x0080 and 0x0200 are retired deposit permissions: keep them unused.
    WITHDRAW_ETHER: 0x0040,
    WITHDRAW_COINS: 0x0100,
    WITHDRAW_COLLECTIBLES: 0x0400,
    EXECUTE_WHITELISTED: 0x0800,
    MANAGE_EXECUTION_WHITELIST: 0x1000
};
/** List the names of the permissions in a permission value. */
export const getPermissionsSet = (permissions) => Object.entries(PERMISSIONS)
    .filter((permission) => (permissions & permission[1]) === permission[1])
    .map((permission) => permission[0]);
/** Uppercase the first letter of a string. */
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** Parse a number, or return the fallback if the result is not finite. */
export const parseFiniteNumber = (value, fallback) => {
    const parsed = typeof value === 'number' ? value : Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : fallback;
};
