import { type PublicClient, type WalletClient } from 'viem';
import type { TransactionOptions } from './organigramClient';
import { type ContractClients, type OrganigramTransactionReceipt } from './contracts';
export interface OrganEntry {
    index: string;
    address: string;
    cid: string;
}
/**
 * Entry payload used when creating or updating an organ entry.
 */
export interface IOrganEntry {
    address?: string;
    cid?: string;
}
/**
 * Permission grant applied to a procedure or address on an organ.
 */
export interface OrganPermission {
    permissionAddress: string;
    permissionValue: number;
}
type OrganContractData = {
    cid: string;
    permissionsLength: bigint;
    entriesLength: bigint;
    entriesCount: bigint;
};
export interface OrganInput {
    address?: string | null;
    chainId?: string | null;
    publicClient?: PublicClient | null;
    walletClient?: WalletClient | null;
    balance?: string | null;
    cid?: string | null;
    permissions?: OrganPermission[] | null;
    entries?: Array<{
        index: string;
        address: string;
        cid: string;
    }> | null;
    salt?: string | null;
    isDeployed?: boolean | null;
    name?: string | null;
    description?: string | null;
    organigramId?: string | null;
    forwarder?: string | null;
}
/**
 * JSON-safe serialized representation of one organ.
 */
export interface OrganJson {
    address: string;
    name: string;
    isDeployed: boolean;
    description: string;
    cid: string;
    entries: OrganEntry[];
    permissions: OrganPermission[];
    salt?: string | null;
    chainId: string;
    organigramId: string;
    balance: string;
}
/**
 * High-level names for the writable organ functions exposed by the SDK.
 */
export declare enum OrganFunctionName {
    addEntries = "addEntries",
    removeEntries = "removeEntries",
    replaceEntry = "replaceEntry",
    addPermission = "addPermission",
    removePermission = "removePermission",
    replacePermission = "replacePermission",
    withdrawEther = "withdrawEther",
    withdrawERC20 = "withdrawERC20",
    withdrawERC721 = "withdrawERC721"
}
/**
 * In-memory representation of one deployed or planned organ.
 */
export declare class Organ {
    static INTERFACE: string;
    name: string;
    description: string;
    address: string;
    salt: string | undefined;
    chainId: string;
    balance: string;
    permissions: OrganPermission[];
    cid: string;
    entries: OrganEntry[];
    walletClient?: WalletClient;
    publicClient?: PublicClient;
    contract?: any;
    isDeployed: boolean;
    organigramId: string;
    forwarder: string;
    constructor({ address, chainId, publicClient, walletClient, balance, permissions, cid, entries, salt, isDeployed, name, description, organigramId, forwarder }: OrganInput);
    private getClients;
    private getContract;
    updateCid: (cid: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    addEntries: (entries: IOrganEntry[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    replaceEntry: (index: number, entry: OrganEntry, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    addPermission: (permission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    removePermission: (permission: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    replacePermission: (oldPermissionAddress: string, newOrganPermission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawEther: (to: string, value: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawERC20: (token: string, to: string, amount: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawERC721: (token: string, to: string, tokenId: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    static load(address: string, clients: ContractClients, initialOrgan?: OrganInput): Promise<Organ>;
    static isOrgan(address: string, clients: ContractClients): Promise<boolean>;
    static getBalance(address: string, clients: ContractClients): Promise<bigint>;
    static loadData(address: string, clients: ContractClients): Promise<OrganContractData>;
    static loadEntryForAccount(address: string, account: string, clients: ContractClients): Promise<OrganEntry | undefined>;
    static checkAddressPermissions(organAddress: string, addressToCheck: string, clients: ContractClients): Promise<number>;
    static loadPermission(address: string, index: string, clients: ContractClients): Promise<OrganPermission>;
    static loadPermissions(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganPermission[]>;
    static loadEntry(address: string, index: string, clients: ContractClients): Promise<OrganEntry>;
    static loadEntries(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganEntry[]>;
    static populateTransaction(address: string, walletClient: WalletClient, functionName: OrganFunctionName | string, ...args: unknown[]): Promise<{
        to: string;
        data: string;
        functionName: string;
    }>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadPermissions(): Promise<Organ>;
    reloadData(): Promise<Organ>;
    toJson: () => OrganJson;
}
export {};
