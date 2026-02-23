import { Signer } from 'ethers';
import { Asset, type AssetInput, type AssetJson } from './asset';
import { Organ, type OrganInput, type OrganJson } from './organ';
import { Procedure, type ProcedureInput, type ProcedureJson } from './procedure';
import OrganigramClient from './organigramClient';
import { templates } from './template';
export type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders';
export declare const procedureRoleTypes: {
    label: string;
    name: string;
}[];
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
    load: (input?: {
        signer?: Signer | null;
    }) => Promise<Organigram>;
    deploy(): Promise<Organigram>;
    toJson: () => OrganigramJson;
}
