import { ethers, type ContractTransaction } from 'ethers';
import Organ, { OrganEntry, OrganPermission } from './organ';
import { PopulateInitializeInput, Procedure, ProcedureType, ProcedureTypeName } from './procedure';
import { Organigram } from './organigram';
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
export declare const procedureTypes: {
    erc20Vote: {
        address: string;
        key: string;
        fields: {
            erc20: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            quorumSize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
        };
        metadata: {
            cid: string;
            label: string;
            description: string;
            type: string;
            _type: string;
            _generator: string;
            _generatedAt: number;
        };
    };
    nomination: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
    };
    vote: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
        fields: {
            quorumSize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
        };
    };
};
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
    static loadProcedureTypes(provider: ethers.Provider): Promise<ProcedureType[]>;
    static load(input: {
        provider: ethers.Provider;
        signer?: ethers.Signer;
    }): Promise<OrganigramClient>;
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    getOrgan(address: string, cached?: boolean): Promise<Organ>;
    getProcedure(address: string, cached?: boolean): Promise<Procedure>;
    deployOrgan(input?: DeployOrganInput): Promise<Organ>;
    _prepareDeployOrgansInput(deployOrgansInput: DeployOrganInput[]): {
        permissionAddresses: string[];
        permissionValues: string[];
        cid: string;
        salt: string;
    }[];
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    deployAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    deployAssets(assets: DeployAssetInput[], options?: TransactionOptions): Promise<string[]>;
    _deployProcedure({ typeAddress, initialize, salt, options }: {
        typeAddress: string;
        initialize: ethers.ContractTransaction;
        salt?: string;
        options?: TransactionOptions;
    }): Promise<string | null>;
    _populateInitializeProcedure(input: PopulateInitializeInput): Promise<ContractTransaction>;
    deployProcedure(input: DeployProceduresInput): Promise<Procedure>;
    _prepareDeployProceduresInput(deployProceduresInput: DeployProceduresInput[]): Promise<{
        procedureType: string;
        data: string;
        salt: string;
        options: TransactionOptions | undefined;
    }[]>;
    deployProcedures(deployProceduresInput: DeployProceduresInput[]): Promise<Procedure[]>;
    deployOrganigram(input: DeployOrganigramInput): Promise<ContractTransaction>;
    loadOrganigram(organigram: Organigram, cached?: boolean, options?: {
        discover: boolean;
        limit: number;
    }): Organigram;
}
export default OrganigramClient;
