import { ethers, type Signer } from 'ethers';
import type { TransactionOptions } from './organigramClient';
export interface OrganEntry {
    index: string;
    address: string;
    cid: string;
}
export interface IOrganEntry {
    address?: string;
    cid?: string;
}
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
    signerOrProvider?: ethers.Signer | ethers.Provider | null;
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
export declare enum OrganFunctionName {
    addEntries = 0,
    removeEntries = 1,
    replaceEntry = 2,
    addPermission = 3,
    removePermission = 4,
    replacePermission = 5,
    withdrawEther = 6,
    withdrawERC20 = 7,
    withdrawERC721 = 8
}
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
    signer: Signer | undefined;
    provider: ethers.Provider | undefined;
    contract: ethers.Contract;
    isDeployed: boolean;
    organigramId: string;
    forwarder: string;
    constructor({ address, chainId, signerOrProvider, balance, permissions, cid, entries, salt, isDeployed, name, description, organigramId, forwarder }: OrganInput);
    updateCid: (cid: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addEntries: (entries: IOrganEntry[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    replaceEntry: (index: number, entry: OrganEntry, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addPermission: (permission: OrganPermission, options?: TransactionOptions) => Promise<ethers.ContractTransactionReceipt>;
    removePermission: (permission: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    replacePermission: (oldPermissionAddress: string, newOrganPermission: OrganPermission, options?: TransactionOptions) => Promise<ethers.Transaction>;
    withdrawEther: (to: string, value: ethers.BigNumberish, options?: TransactionOptions) => Promise<ethers.ContractTransactionReceipt | null>;
    withdrawERC20: (token: string, to: string, amount: ethers.BigNumberish, options?: TransactionOptions) => Promise<ethers.ContractTransactionReceipt | null>;
    withdrawERC721: (token: string, to: string, tokenId: ethers.BigNumberish, options?: TransactionOptions) => Promise<ethers.ContractTransactionReceipt | null>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider, initialOrgan?: OrganInput): Promise<Organ>;
    static isOrgan(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<boolean>;
    static getBalance(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<bigint>;
    static loadData(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganContractData>;
    static loadEntryForAccount(address: string, account: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry | undefined>;
    static checkAddressPermissions(organAddress: string, addressToCheck: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<number>;
    static loadPermission(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganPermission>;
    static loadPermissions(address: string, signerOrProvider: ethers.Signer | ethers.Provider, data?: OrganContractData): Promise<OrganPermission[]>;
    static loadEntry(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry>;
    static loadEntries(address: string, signerOrProvider: ethers.Signer | ethers.Provider, data?: OrganContractData): Promise<OrganEntry[]>;
    static populateTransaction(address: string, signer: ethers.Signer, functionName: OrganFunctionName, ...args: unknown[]): Promise<ethers.ContractTransaction>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadPermissions(): Promise<Organ>;
    reloadData(): Promise<Organ>;
    toJson: () => OrganJson;
}
export {};
