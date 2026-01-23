import sepoliaAddresses from '@organigram/protocol/ignition/deployments/chain-11155111/deployed_addresses.json';
const formatDeployedJson = (object) => Object.fromEntries(Object.entries(object).map(([key, value]) => [key.split('#')[1], value]));
export const deployedAddresses = {
    11155111: formatDeployedJson(sepoliaAddresses)
};
export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
export const PERMISSIONS = {
    ADMIN: 0xffff,
    ALL: 0x07ff,
    ALL_PROCEDURES: 0x0003,
    ALL_ENTRIES: 0x000c,
    ADD_PROCEDURES: 0x0001,
    REMOVE_PROCEDURES: 0x0002,
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
