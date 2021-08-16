import { CID } from './ipfs';
import { Network, Address, Metadata } from './types';
export declare const ORGAN_CONTRACT_SIGNATURES: string[];
export interface OrganEntry {
    index: string;
    address: Address;
    cid: CID | undefined;
    data?: any;
}
export interface OrganProcedure {
    address: Address;
    permissions: number;
}
export interface OrganData {
    address: string;
    network: Network;
    balance: string;
    metadata: Metadata;
    procedures: OrganProcedure[];
    entries: OrganEntry[];
}
export declare class Organ {
    static INTERFACE: string;
    address: string;
    network: Network;
    balance: string;
    procedures: OrganProcedure[];
    metadata: Metadata;
    entries: OrganEntry[];
    constructor({ address, network, balance, procedures, metadata, entries }: OrganData);
    updateMetadata: (cid?: any) => Promise<any>;
    addEntries: (entries: OrganEntry[]) => Promise<Organ>;
    removeEntries: (indexes: string[]) => Promise<boolean>;
    replaceEntry: (index: number, entry: OrganEntry) => Promise<Organ>;
    addProcedure: (procedure: OrganProcedure) => Promise<Organ>;
    removeProcedure: (procedure: Address) => Promise<Organ>;
    replaceProcedure: (oldProcedure: Address, newOrganProcedure: OrganProcedure) => Promise<Organ>;
    static load(address: string): Promise<Organ>;
    static isOrgan(address: Address): Promise<boolean>;
    static getBalance(address: Address): Promise<string>;
    static loadData(address: Address): Promise<{
        metadata: CID | undefined;
        proceduresLength: string;
        entriesLength: string;
        entriesCount: string;
    }>;
    static loadEntryForAccount(address: Address, account: Address): Promise<OrganEntry | null>;
    static loadPermissions(address: Address, procedure: Address): Promise<any>;
    static loadProcedure(address: Address, index: string): Promise<OrganProcedure>;
    static loadProcedures(address: Address): Promise<OrganProcedure[]>;
    static loadEntry(address: Address, index: string): Promise<OrganEntry>;
    static loadEntries(address: Address): Promise<OrganEntry[]>;
    static generateEncodedABI(address: Address, functionName: 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addProcedure' | 'removeProcedure' | 'replaceProcedure', ...args: any[]): Promise<Request>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadProcedures(): Promise<Organ>;
    reloadData(): Promise<Organ>;
}
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
export default Organ;
