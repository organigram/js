import { ethers, type ContractTransaction } from 'ethers';
import Organ, { OrganEntry, OrganInput, OrganPermission } from './organ';
import { Procedure, ProcedureInput, ProcedureType } from './procedure';
import { Organigram } from './organigram';
import { ProcedureTypeName } from './procedure/utils';
export interface DeployOrganInput {
    cid?: string;
    permissions?: OrganPermission[];
    entries?: OrganEntry[];
    salt?: string;
    options?: TransactionOptions;
}
export interface DeployProceduresInput {
    typeName: ProcedureTypeName;
    chainId?: string | null;
    cid?: string | null;
    proposers?: string | null;
    moderators?: string | null;
    deciders: string;
    withModeration?: boolean | null;
    forwarder?: string | null;
    salt?: string | null;
    options?: TransactionOptions;
    data?: string;
    args?: string[];
}
export interface DeployOrganigramInput {
    organs: DeployOrganInput[];
    assets: DeployAssetInput[];
    procedures: DeployProceduresInput[];
}
export interface DeployAssetInput {
    name: string;
    symbol: string;
    initialSupply?: number | null;
    salt?: string | null;
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
export declare class OrganigramClient {
    address: string;
    chainId: string;
    procedureTypes: ProcedureType[];
    organs: Organ[];
    procedures: Procedure[];
    cids: File[];
    provider: ethers.Provider;
    contract: ethers.Contract;
    signer?: ethers.Signer;
    constructor(input: {
        provider: ethers.Provider;
        address?: string;
        chainId?: string;
        procedureTypes?: ProcedureType[];
        contract?: ethers.Contract;
        signer?: ethers.Signer;
    });
    static loadProcedureType({ addr, cid }: {
        addr: string;
        cid?: string;
    }, provider: ethers.Provider): Promise<ProcedureType>;
    static loadProcedureTypes({ address, provider }: {
        provider: ethers.Provider;
        address?: string;
    }): Promise<ProcedureType[]>;
    static load(input: {
        address?: string;
        provider: ethers.Provider;
        signer?: ethers.Signer;
    }): Promise<OrganigramClient>;
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    getOrgan(address: string, cached?: boolean, initialOrgan?: OrganInput): Promise<Organ>;
    getDeployedProcedure(address: string, cached?: boolean, initialProcedure?: ProcedureInput): Promise<Procedure>;
    deployOrgan(input?: DeployOrganInput): Promise<Organ>;
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    deployAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    deployAssets(assets: DeployAssetInput[], options?: TransactionOptions): Promise<string[]>;
    deployProcedure(input: DeployProceduresInput): Promise<Procedure>;
    deployProcedures(deployProceduresInput: DeployProceduresInput[]): Promise<Procedure[]>;
    deployOrganigram(input: DeployOrganigramInput): Promise<ContractTransaction>;
    loadContract(address: string, cached?: boolean): Promise<Organ | Procedure | null>;
    loadContracts(contractAddresses: string[]): Promise<Organigram>;
    loadOrganigram(organigram: Organigram, cached?: boolean): Promise<Organigram>;
}
export default OrganigramClient;
