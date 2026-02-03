import { ethers, type ContractTransaction } from 'ethers';
import Organ, { OrganPermission } from './organ';
import { Procedure } from './procedure';
import { Organigram } from './organigram';
export interface DeployOrganInput {
    metadata: string;
    permissions: OrganPermission[];
    salt?: string;
    options?: TransactionOptions;
}
export interface DeployProceduresInput {
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
export interface DeployOrganigramInput {
    organs: DeployOrganInput[];
    assets: DeployAssetInput[];
    procedures: DeployProceduresInput[];
}
export interface DeployAssetInput {
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
    deployOrgan({ metadata, permissions, salt, options }: DeployOrganInput): Promise<Organ>;
    _prepareDeployOrgansInput(deployOrgansInput: DeployOrganInput[]): {
        permissionAddresses: string[];
        permissionValues: number[];
        cid: string;
        salt: string;
    }[];
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    deployAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    deployAssets(assets: DeployAssetInput[], options?: TransactionOptions): Promise<string[]>;
    _deployProcedure({ type, initialize, salt, options }: {
        type: string;
        initialize: ethers.ContractTransaction;
        salt?: string;
        options?: TransactionOptions;
    }): Promise<Procedure>;
    _populateInitializeProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, ...args: unknown[]): Promise<ContractTransaction>;
    deployProcedure(type: string, options: TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, salt: string, ...args: unknown[]): Promise<EnhancedProcedure>;
    _prepareDeployProceduresInput(deployProceduresInput: DeployProceduresInput[]): Promise<{
        procedureType: string;
        data: string;
        salt: string;
        options: TransactionOptions | undefined;
    }[]>;
    deployProcedures(deployProceduresInput: DeployProceduresInput[]): Promise<EnhancedProcedure[]>;
    deployOrganigram(input: DeployOrganigramInput): Promise<ContractTransaction>;
    loadOrganigram(organigram: Organigram, cached?: boolean, options?: {
        discover: boolean;
        limit: number;
    }): Organigram;
}
export default OrganigramClient;
