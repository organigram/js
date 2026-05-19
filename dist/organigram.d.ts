import { Asset, type AssetInput, type AssetJson } from './asset';
import { Organ, type OrganInput, type OrganJson } from './organ';
import { Procedure, type ProcedureInput, type ProcedureJson } from './procedure';
import OrganigramClient from './organigramClient';
import { templates } from './template';
import type { PublicClient, WalletClient } from 'viem';
/**
 * Named organ roles used by procedure access control.
 */
export type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders';
/**
 * Human-readable labels for the procedure role slots expected by the protocol.
 */
export declare const procedureRoleTypes: {
    label: string;
    name: string;
}[];
export declare const organigramEdgeTypes: readonly ["default", "straight", "step", "smoothstep"];
export type OrganigramEdgeType = (typeof organigramEdgeTypes)[number];
export declare const defaultOrganigramEdgeType: OrganigramEdgeType;
export type OrganigramNodePosition = {
    x: number;
    y: number;
};
export type OrganigramNodePositions = Record<string, OrganigramNodePosition>;
export declare const normalizeOrganigramEdgeType: (edgeType?: string | null) => OrganigramEdgeType;
export declare const normalizeOrganigramNodePositions: (nodePositions?: unknown) => OrganigramNodePositions;
/**
 * JSON-safe serialized representation of an organigram.
 */
export type OrganigramJson = {
    id: string;
    slug: string;
    name: string;
    description: string;
    edgeType: OrganigramEdgeType;
    nodePositions: OrganigramNodePositions;
    chainId: string;
    organs: OrganJson[];
    procedures: ProcedureJson[];
    assets: AssetJson[];
    workspaceId?: string | null;
};
/**
 * Input used to create an in-memory organigram model.
 */
export type OrganigramInput = {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    edgeType?: string | null;
    nodePositions?: unknown;
    chainId?: string | null;
    organs: OrganInput[];
    procedures: ProcedureInput[];
    assets: AssetInput[];
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};
/**
 * Default chain id used by the SDK templates.
 */
export declare const defaultChainId: string;
/**
 * In-memory representation of an Organigram project.
 *
 * The class can be created from raw inputs, a built-in template name, or left
 * blank to start from the default empty template.
 */
export declare class Organigram {
    id: string;
    organs: Organ[];
    assets: Asset[];
    procedures: Procedure[];
    chainId: string;
    slug: string;
    name: string;
    description: string;
    edgeType: OrganigramEdgeType;
    nodePositions: OrganigramNodePositions;
    workspaceId?: string | null;
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    constructor(input?: OrganigramInput | keyof typeof templates | string[]);
    editDetails({ name, description, edgeType, nodePositions }: {
        name?: string;
        description?: string;
        edgeType?: OrganigramEdgeType;
        nodePositions?: OrganigramNodePositions;
        contractAddresses?: string[];
    }): void;
    setOrgans(organs: Organ[]): void;
    setAssets(assets: Asset[]): void;
    setProcedures(procedures: Procedure[]): void;
    /**
     * Hydrate every deployed object referenced by this organigram.
     *
     * @param input Optional viem clients used when the organigram has no attached client yet.
     */
    load: (input?: {
        walletClient?: WalletClient | null;
        publicClient?: PublicClient | null;
    }) => Promise<Organigram>;
    /**
     * Deploy the full organigram through its attached client, then reload it from chain state.
     */
    deploy(): Promise<Organigram>;
    /**
     * Convert the organigram into a JSON-safe structure suitable for persistence or transport.
     */
    toJson: () => OrganigramJson;
}
