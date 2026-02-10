import deployedAddresses from '@organigram/protocol/deployments.json';
import { ethers } from 'ethers';
export { deployedAddresses };
export function cloneInitCodeHash(implementation) {
    const impl = implementation.toLowerCase().replace(/^0x/, '');
    const initCode = '0x3d602d80600a3d3981f3' +
        '363d3d373d3d3d363d73' +
        impl +
        '5af43d82803e903d91602b57fd5bf3';
    return ethers.keccak256(initCode);
}
export const predictContractAddress = ({ type, chainId, salt }) => {
    return ethers.getCreate2Address(deployedAddresses[chainId]?.OrganigramClient, ethers.zeroPadValue(salt, 32), cloneInitCodeHash(type === 'Organ'
        ? deployedAddresses[chainId]?.CloneableOrgan
        : deployedAddresses[chainId]?.[type.replace('Erc', 'ERC')]));
};
export const createRandom32BytesHexId = () => ethers.hexlify(ethers.randomBytes(32));
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
export const PERMISSIONS = {
    ADMIN: 0xffff,
    ALL: 0x07ff,
    ALL_PERMISSIONS: 0x0003,
    ALL_ENTRIES: 0x000c,
    ADD_PERMISSIONS: 0x0001,
    REMOVE_PERMISSIONS: 0x0002,
    ADD_ENTRIES: 0x0004,
    REMOVE_ENTRIES: 0x0008,
    UPDATE_METADATA: 0x0010,
    DEPOSIT_ETHER: 0x0020,
    WITHDRAW_ETHER: 0x0040,
    DEPOSIT_COINS: 0x0080,
    WITHDRAW_COINS: 0x0100,
    DEPOSIT_COLLECTIBLES: 0x0200,
    WITHDRAW_COLLECTIBLES: 0x0400
};
export const getPermissionsSet = (permissions) => Object.entries(PERMISSIONS)
    .filter((permission) => (permissions & permission[1]) === permission[1])
    .map((permission) => permission[0]);
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
