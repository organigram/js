import { Signer } from 'ethers';
import { Asset } from './asset';
import Organ from './organ';
import { Procedure } from './procedure';
import OrganigramClient, { DeployOrganigramInput, EnhancedProcedure } from './organigramClient';
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
export declare const getSourcesAndTargets: (initialOrganigram: Organigram) => Organigram;
export declare const getProcedureSourcesAndTargets: (procedure: Procedure) => ProcedureWithSourcesAndTargets;
export declare const getOrganSourcesAndTargets: (organ: Organ) => OrganWithSourcesAndTargets;
export declare const getAssetSourcesAndTargets: (asset: Asset) => AssetWithSourcesAndTargets;
export declare const makeOrganigramDeployArgument: (organigram: Organigram, signer?: Signer) => DeployOrganigramInput;
export declare class Organigram {
    id?: string;
    name?: string;
    description?: string;
    organs: OrganWithSourcesAndTargets[];
    procedures: ProcedureWithSourcesAndTargets[];
    assets: AssetWithSourcesAndTargets[];
    client?: OrganigramClient;
    signer?: Signer;
    constructor(initialOrganigram: {
        id?: string;
        name?: string;
        description?: string;
        contractAddresses?: string[];
    });
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
