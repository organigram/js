import { ethers, type ContractTransaction } from 'ethers';
import Organ from './organ';
import Procedure from './procedure';
import type { TransactionOptions } from './types';
export interface File {
    cid: string;
    data: unknown;
}
export interface ProcedureType {
    key: string;
    name: string;
    address: string;
    metadata: unknown;
    Class: unknown;
}
export type EnhancedProcedure = Procedure & {
    type: ProcedureType;
};
export declare class OrganigramClient {
    address: string;
    chainId: string;
    procedureTypes: ProcedureType[];
    organs: Organ[];
    procedures: EnhancedProcedure[];
    cids: File[];
    provider: ethers.Provider;
    contract: ethers.Contract;
    signer?: ethers.Signer;
    constructor(address: string, chainId: string, procedureTypes: ProcedureType[], contract: ethers.Contract, provider: ethers.Provider, signer?: ethers.Signer);
    static loadProcedureType({ addr, cid }: {
        addr: string;
        cid?: string;
    }, provider: ethers.Provider): Promise<ProcedureType>;
    static loadProcedureTypes(address: string, provider: ethers.Provider): Promise<ProcedureType[]>;
    static load(address: string, provider: ethers.Provider, signer?: ethers.Signer): Promise<OrganigramClient>;
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    getOrgan(address: string, cached?: boolean): Promise<Organ>;
    getProcedure(address: string, cached?: boolean): Promise<EnhancedProcedure>;
    getContract(address: string, cached?: boolean): Promise<Organ | EnhancedProcedure | null>;
    createOrgan(metadata: string, admin: string, options?: TransactionOptions): Promise<Organ>;
    _createProcedure(type: string, initialize?: ethers.ContractTransaction, options?: TransactionOptions): Promise<Procedure>;
    _initializeProcedure(address: string, type: string, options: TransactionOptions, metadata: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, ...args: unknown[]): Promise<EnhancedProcedure>;
    _populateInitializeProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, ...args: unknown[]): Promise<ContractTransaction>;
    createProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, ...args: unknown[]): Promise<EnhancedProcedure>;
}
export default OrganigramClient;
