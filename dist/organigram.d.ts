import { Signer } from 'ethers';
import { Asset, AssetJson } from './asset';
import Organ, { OrganInput, OrganJson } from './organ';
import { Procedure, ProcedureJson } from './procedure';
import OrganigramClient, { DeployOrganigramInput, EnhancedProcedure } from './organigramClient';
import { templates } from './template';
export type SourceOrgan = {
    organAddress: string;
    procedureAddress: string;
    assetAddress?: string;
};
export type SourcesAndTargets = {
    isSourceOrgan: SourceOrgan[];
    isTargetOrgan: TargetOrgan[];
};
export type ProcedureSourcesAndTargets = {
    targetOrgans: TargetOrgan[];
    sourceOrgans: SourceOrgan[];
};
export type TargetOrgan = SourceOrgan & {
    permissionValue: number;
};
export type OrganWithSourcesAndTargets = Organ & SourcesAndTargets;
export type AssetWithSourcesAndTargets = Asset & SourcesAndTargets;
export type ProcedureWithSourcesAndTargets = EnhancedProcedure & ProcedureSourcesAndTargets;
export type OrganigramJson = {
    organs: OrganJson[];
    procedures: ProcedureJson[];
    assets: AssetJson[];
};
export declare const getProcedureSourcesAndTargets: (procedure: Procedure, organigram: Organigram) => ProcedureWithSourcesAndTargets;
export declare const getOrganSourcesAndTargets: (organ: OrganInput, organigram: Organigram) => OrganWithSourcesAndTargets;
export declare const getAssetSourcesAndTargets: (asset: Asset, organigram: Organigram) => AssetWithSourcesAndTargets;
export declare const getSourcesAndTargets: (initialOrganigram: OrganigramInput) => {
    organs: OrganWithSourcesAndTargets[] | undefined;
    procedures: ProcedureWithSourcesAndTargets[] | undefined;
    assets: AssetWithSourcesAndTargets[] | undefined;
    id?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    chainId?: string | undefined;
    client?: OrganigramClient | undefined;
    signer?: Signer | undefined;
    contractAddresses?: string[] | undefined;
};
export declare const makeOrganigramDeployArgument: (organigram: Organigram, signer?: Signer) => DeployOrganigramInput;
export type OrganigramInput = Partial<{
    id?: string;
    name?: string;
    description?: string;
    chainId?: string;
    organs: OrganInput[];
    procedures: Partial<ProcedureWithSourcesAndTargets>[];
    assets: Partial<AssetWithSourcesAndTargets>[];
    client?: OrganigramClient;
    signer?: Signer;
    contractAddresses?: string[];
}>;
export declare const defaultChainId = "11155111";
export declare class Organigram {
    organs: OrganWithSourcesAndTargets[];
    procedures: ProcedureWithSourcesAndTargets[];
    assets: AssetWithSourcesAndTargets[];
    chainId: string;
    id?: string;
    name?: string;
    description?: string;
    client?: OrganigramClient;
    signer?: Signer;
    constructor(input?: OrganigramInput | keyof typeof templates | string[]);
    editDetails({ name, description }: {
        name?: string;
        description?: string;
        contractAddresses?: string[];
    }): void;
    setOrgans(organs: Organ[]): void;
    setAssets(assets: Asset[]): void;
    setProcedures(procedures: Procedure[]): void;
    load: (options?: {
        discover: boolean;
        limit: number;
    }) => Promise<void>;
    deploy(signer?: Signer): Promise<void | undefined>;
    toJson: () => string;
}
