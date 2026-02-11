import { Signer } from 'ethers';
import { Asset, AssetInput, AssetJson } from './asset';
import Organ, { OrganInput, OrganJson } from './organ';
import { Procedure, ProcedureInput, ProcedureJson } from './procedure';
import OrganigramClient, { DeployOrganigramInput } from './organigramClient';
import { templates } from './template';
export type SourceOrganTypeName = 'proposers' | 'moderators' | 'deciders' | 'target';
export type SourceOrgan = {
    organAddress?: string | null;
    procedureAddress?: string | null;
    assetAddress?: string | null;
    types?: SourceOrganTypeName[];
};
export declare const sourceOrganTypes: {
    label: string;
    name: string;
}[];
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
export type OrganigramJson = {
    id: string;
    slug: string;
    name: string;
    description: string;
    chainId: string;
    organs: OrganJson[];
    procedures: ProcedureJson[];
    assets: AssetJson[];
    workspaceId?: string | null;
};
export declare const getProcedureSourcesAndTargets: (procedure: ProcedureInput, organigram: OrganigramJson) => ProcedureJson;
export declare const getOrganSourcesAndTargets: (organ: OrganInput, organigram: Organigram) => OrganJson;
export declare const getAssetSourcesAndTargets: (asset: Asset, organigram: Organigram) => Asset;
export declare const getSourcesAndTargets: (initialOrganigram: OrganigramInput) => OrganigramJson;
export declare const makeOrganigramDeployArgument: (organigram: Organigram, signer?: Signer) => DeployOrganigramInput;
export type OrganigramInput = {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    chainId?: string | null;
    organs: OrganInput[];
    procedures: ProcedureInput[];
    assets: AssetInput[];
    organigramClient?: OrganigramClient | null;
    signer?: Signer | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};
export declare const defaultChainId = "11155111";
export declare class Organigram {
    id: string;
    organs: Organ[];
    assets: Asset[];
    procedures: Procedure[];
    chainId: string;
    slug: string;
    name: string;
    description: string;
    workspaceId?: string | null;
    organigramClient?: OrganigramClient | null;
    signer?: Signer | null;
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
    deploy(): Promise<void>;
    toJson: () => OrganigramJson;
}
