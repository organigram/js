import { CID } from './ipfs';
import type { Network, Metadata, Address } from './types';
export declare const ORGAN_CONTRACT_SIGNATURES: string[];
export interface OrganEntry {
    index: string;
    address: Address;
    cid: CID | undefined;
    data?: any;
}
export interface OrganProcedure {
    address: Address;
    permissions: string | number;
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
    updateMetadata: (cid?: CID) => Promise<any>;
    addEntries: (entries: OrganEntry[]) => Promise<Organ>;
    removeEntries: (indexes: string[]) => Promise<boolean>;
    replaceEntry: (index: Number, entry: OrganEntry) => Promise<Organ>;
    addProcedure: (procedure: OrganProcedure) => Promise<Organ>;
    removeProcedure: (procedure: Address) => Promise<Organ>;
    replaceProcedure: (oldProcedure: Address, newOrganProcedure: OrganProcedure) => Promise<Organ>;
    static load(address: string): Promise<Organ>;
    static isOrgan(address: Address): Promise<boolean>;
    static getBalance(address: Address): Promise<string>;
    static loadData(address: Address): Promise<{
        metadata: Metadata;
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
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadProcedures(): Promise<Organ>;
    reloadData(): Promise<Organ>;
}
export declare const PERMISSIONS: {
    ADMIN: string;
    ALL: string;
    ALL_PROCEDURES: string;
    ALL_ENTRIES: string;
    ADD_PROCEDURES: string;
    REMOVE_PROCEDURES: string;
    ADD_ENTRIES: string;
    REMOVE_ENTRIES: string;
    UPDATE_METADATA: string;
    DEPOSIT_ETHER: string;
    WITHDRAW_ETHER: string;
    DEPOSIT_COINS: string;
    WITHDRAW_COINS: string;
    DEPOSIT_COLLECTIBLES: string;
    WITHDRAW_COLLECTIBLES: string;
};
export default Organ;
