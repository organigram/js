import { ethers, type ContractTransaction } from 'ethers';
import Organ, { OrganPermission } from './organ';
import { Procedure } from './procedure';
export interface CreateOrganInput {
    metadata: string;
    permissions: OrganPermission[];
    salt?: string;
    options?: TransactionOptions;
}
export interface CreateProceduresInput {
    type: string;
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    forwarder: string;
    salt?: string;
    options?: TransactionOptions;
    args?: unknown[];
}
export interface CreateAssetInput {
    name: string;
    symbol: string;
    initialSupply: number;
    salt?: string;
}
export interface TransactionOptions {
    nonce?: number;
    customData?: {
        index?: number;
    };
    onTransaction?: (tx: ethers.TransactionResponse, description: string) => void;
}
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
    createOrgan({ metadata, permissions, salt, options }: CreateOrganInput): Promise<Organ>;
    _prepareCreateOrgansInput(createOrgansInput: CreateOrganInput[]): {
        permissionAddresses: string[];
        permissionValues: number[];
        cid: string;
        salt: string;
    }[];
    createOrgans(createOrgansInput: CreateOrganInput[]): Promise<Organ[]>;
    createAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    createAssets(assets: CreateAssetInput[], options?: TransactionOptions): Promise<string[]>;
    _createProcedure({ type, initialize, salt, options }: {
        type: string;
        initialize: ethers.ContractTransaction;
        salt?: string;
        options?: TransactionOptions;
    }): Promise<Procedure>;
    _populateInitializeProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, ...args: unknown[]): Promise<ContractTransaction>;
    createProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, salt: string, ...args: unknown[]): Promise<EnhancedProcedure>;
    _prepareCreateProceduresInput(createProceduresInput: CreateProceduresInput[]): Promise<{
        procedureType: string;
        data: string;
        salt: string;
        options: TransactionOptions | undefined;
    }[]>;
    createProcedures(createProceduresInput: CreateProceduresInput[]): Promise<EnhancedProcedure[]>;
    deployOrganigram(input: {
        organs: CreateOrganInput[];
        assets: CreateAssetInput[];
        procedures: CreateProceduresInput[];
    }): Promise<ContractTransaction>;
}
export default OrganigramClient;
