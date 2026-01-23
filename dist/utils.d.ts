export declare const deployedAddresses: {
    11155111: {
        [k: string]: string;
    };
};
export declare const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare const PERMISSIONS: {
    ADMIN: number;
    ALL: number;
    ALL_PROCEDURES: number;
    ALL_ENTRIES: number;
    ADD_PROCEDURES: number;
    REMOVE_PROCEDURES: number;
    ADD_ENTRIES: number;
    REMOVE_ENTRIES: number;
    UPDATE_METADATA: number;
    DEPOSIT_ETHER: number;
    WITHDRAW_ETHER: number;
    DEPOSIT_COINS: number;
    WITHDRAW_COINS: number;
    DEPOSIT_COLLECTIBLES: number;
    WITHDRAW_COLLECTIBLES: number;
};
export declare const getPermissionsSet: (permissions: number) => string[];
