import deployedAddresses, { getChainExplorerBaseUrl, getConfiguredChain, getDefaultChainId, getDeployment, getHostUrl, getSupportedChainIds, getSupportedChains, isSupportedChainId, isLocalHost, resolveDeployment } from './deployments';
export { deployedAddresses, getChainExplorerBaseUrl, getConfiguredChain, getDefaultChainId, getDeployment, getHostUrl, getSupportedChainIds, getSupportedChains, isSupportedChainId, isLocalHost, resolveDeployment };
/** Name of a protocol contract. */
export type ContractName = 'Organ' | 'Asset' | 'EquityToken' | 'ERC20VoteProcedure' | 'VoteProcedure' | 'NominationProcedure' | 'OrganigramClient';
/** A `JSON.stringify` replacer that writes bigints as strings ending in `n`. */
export declare const handleJsonBigInt: (_key: string, value: unknown) => unknown;
export declare function cloneInitCodeHash(implementation: string): string;
/**
 * Predict the address of a clone deployed by the OrganigramClient.
 *
 * The client binds each salt to the account deploying the clone, so only an
 * address predicted with `deployer` is the address the clone will have.
 * Without it, the result is merely a unique placeholder for a draft.
 */
export declare const predictContractAddress: ({ type, chainId, salt, deployer }: {
    type: Omit<ContractName, "OrganigramClient">;
    chainId: string;
    salt: string;
    deployer?: string;
}) => string;
/** Generate a random 32-byte hex string, for example a salt. */
export declare const createRandom32BytesHexId: () => `0x${string}`;
export declare const formatSalt: (salt?: string | null) => string;
/**
 * Bit flags of the permissions an address can hold on an organ. Combine them with `|`.
 *
 * @example
 * ```ts
 * PERMISSIONS.ADD_ENTRIES | PERMISSIONS.REMOVE_ENTRIES
 * ```
 */
export declare const PERMISSIONS: {
    ADMIN: number;
    ALL: number;
    ALL_PERMISSIONS: number;
    ALL_ENTRIES: number;
    ADD_PERMISSIONS: number;
    REMOVE_PERMISSIONS: number;
    ADD_ENTRIES: number;
    REMOVE_ENTRIES: number;
    UPDATE_METADATA: number;
    WITHDRAW_ETHER: number;
    WITHDRAW_COINS: number;
    WITHDRAW_COLLECTIBLES: number;
    EXECUTE_WHITELISTED: number;
    MANAGE_EXECUTION_WHITELIST: number;
};
/** List the names of the permissions in a permission value. */
export declare const getPermissionsSet: (permissions: number) => string[];
/** Uppercase the first letter of a string. */
export declare const capitalize: (s: string) => string;
/** Parse a number, or return the fallback if the result is not finite. */
export declare const parseFiniteNumber: (value: number | string | null | undefined, fallback: number) => number;
