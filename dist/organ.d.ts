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
export interface OrganData {
    address: string;
    chainId: string;
    signerOrProvider: ethers.Signer | ethers.Provider;
    balance: bigint;
    cid: string;
    permissions: OrganPermission[];
    entries: OrganEntry[];
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
    address: string;
    chainId: string;
    balance: bigint;
    permissions: OrganPermission[];
    cid: string;
    entries: OrganEntry[];
    signer?: Signer;
    provider?: ethers.Provider;
    contract: ethers.Contract;
    constructor({ address, chainId, signerOrProvider, balance, permissions, cid, entries }: OrganData);
    updateCid: (cid: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addEntries: (entries: IOrganEntry[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    replaceEntry: (index: number, entry: OrganEntry, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addPermission: (permission: OrganPermission, options?: TransactionOptions) => Promise<ethers.Transaction>;
    removePermission: (permission: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    replacePermission: (oldPermissionAddress: string, newOrganPermission: OrganPermission, options?: TransactionOptions) => Promise<ethers.Transaction>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Organ>;
    static isOrgan(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<boolean>;
    static getBalance(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<bigint>;
    static loadData(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<{
        cid: string;
        permissionsLength: bigint;
        entriesLength: bigint;
        entriesCount: bigint;
    }>;
    static loadEntryForAccount(address: string, account: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry | undefined>;
    static checkAddressPermissions(organAddress: string, addressToCheck: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<number>;
    static loadPermission(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganPermission>;
    static loadPermissions(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganPermission[]>;
    static loadEntry(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry>;
    static loadEntries(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry[]>;
    static populateTransaction(address: string, signer: ethers.Signer, functionName: OrganFunctionName, ...args: unknown[]): Promise<ethers.ContractTransaction>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadPermissions(): Promise<Organ>;
    reloadData(): Promise<Organ>;
}
export default Organ;
