import { ethers, type Signer } from 'ethers';
import type { TransactionOptions } from './types';
export interface OrganEntry {
    index: string;
    address: string;
    cid: string;
}
export interface IOrganEntry {
    address?: string;
    cid?: string;
}
export interface OrganProcedure {
    address: string;
    permissions: number;
}
export interface OrganData {
    address: string;
    chainId: string;
    signerOrProvider: ethers.Signer | ethers.Provider;
    balance: bigint;
    cid: string;
    procedures: OrganProcedure[];
    entries: OrganEntry[];
}
export declare enum OrganFunctionName {
    addEntries = 0,
    removeEntries = 1,
    replaceEntry = 2,
    addProcedure = 3,
    removeProcedure = 4,
    replaceProcedure = 5,
    withdrawEther = 6,
    withdrawERC20 = 7,
    withdrawERC721 = 8
}
export declare class Organ {
    static INTERFACE: string;
    address: string;
    chainId: string;
    balance: bigint;
    procedures: OrganProcedure[];
    cid: string;
    entries: OrganEntry[];
    signer?: Signer;
    provider?: ethers.Provider;
    contract: ethers.Contract;
    constructor({ address, chainId, signerOrProvider, balance, procedures, cid, entries }: OrganData);
    updateCid: (cid: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addEntries: (entries: IOrganEntry[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<ethers.Transaction>;
    replaceEntry: (index: number, entry: OrganEntry, options?: TransactionOptions) => Promise<ethers.Transaction>;
    addProcedure: (procedure: OrganProcedure, options?: TransactionOptions) => Promise<ethers.Transaction>;
    removeProcedure: (procedure: string, options?: TransactionOptions) => Promise<ethers.Transaction>;
    replaceProcedure: (oldProcedure: string, newOrganProcedure: OrganProcedure, options?: TransactionOptions) => Promise<ethers.Transaction>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Organ>;
    static isOrgan(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<boolean>;
    static getBalance(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<bigint>;
    static loadData(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<{
        cid: string;
        proceduresLength: bigint;
        entriesLength: bigint;
        entriesCount: bigint;
    }>;
    static loadEntryForAccount(address: string, account: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry | undefined>;
    static loadPermissions(address: string, procedure: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<number>;
    static loadProcedure(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganProcedure>;
    static loadProcedures(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganProcedure[]>;
    static loadEntry(address: string, index: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry>;
    static loadEntries(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<OrganEntry[]>;
    static populateTransaction(address: string, signer: ethers.Signer, functionName: OrganFunctionName, ...args: unknown[]): Promise<ethers.ContractTransaction>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadProcedures(): Promise<Organ>;
    reloadData(): Promise<Organ>;
}
export default Organ;
