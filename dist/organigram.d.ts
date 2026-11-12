import { Asset, type AssetInput, type AssetJson } from './asset';
import { Organ, type OrganInput, type OrganJson } from './organ';
import { Procedure, type ProcedureInput, type ProcedureJson } from './procedure';
import OrganigramClient from './organigramClient';
import { templates } from './template';
import type { PublicClient, WalletClient } from 'viem';
/** The three roles of a procedure: who proposes, who moderates, who decides. */
export type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders';
/** Line styles available to draw the links of an organigram. */
export declare const organigramEdgeTypes: readonly ["default", "straight", "step", "smoothstep"];
/** Line style of the links of an organigram. */
export type OrganigramEdgeType = (typeof organigramEdgeTypes)[number];
/** Line style used when none is set. */
export declare const defaultOrganigramEdgeType: OrganigramEdgeType;
/** Position of one node in the organigram diagram. */
export type OrganigramNodePosition = {
    x: number;
    y: number;
};
/** Positions of the nodes in the organigram diagram, by contract address. */
export type OrganigramNodePositions = Record<string, OrganigramNodePosition>;
export declare const normalizeOrganigramEdgeType: (edgeType?: string | null) => OrganigramEdgeType;
export declare const normalizeOrganigramNodePositions: (nodePositions?: unknown) => OrganigramNodePositions;
/** An organigram as plain JSON, to store or send it. */
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
/** The data of an organigram, such as a template from `getTemplate()`. */
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
/** Chain used by templates when none is given. */
export declare const defaultChainId: string;
/**
 * A whole organization: its organs, procedures and assets, as a draft or as deployed contracts.
 *
 * @remarks The organigram itself has no contract. Create one from a template or from data, attach an `OrganigramClient`, then call `deploy()`.
 *
 * @example
 * ```ts
 * const organigram = await new Organigram({
 *   ...getTemplate('nonProfit', client.chainId),
 *   organigramClient: client
 * }).deploy()
 * ```
 */
export declare class Organigram {
    /** Identifier of the organigram. */
    id: string;
    /** Organs of the organization. */
    organs: Organ[];
    /** Assets of the organization. */
    assets: Asset[];
    /** Procedures connecting the organs. */
    procedures: Procedure[];
    /** Chain the organigram is deployed on. */
    chainId: string;
    /** URL-friendly name. */
    slug: string;
    /** Display name. */
    name: string;
    /** Free description. */
    description: string;
    /** Line style of the diagram links. */
    edgeType: OrganigramEdgeType;
    /** Positions of the diagram nodes. */
    nodePositions: OrganigramNodePositions;
    /** Workspace the organigram belongs to in the Organigram app. */
    workspaceId?: string | null;
    /** Client used to deploy and load the organigram. */
    organigramClient?: OrganigramClient | null;
    /** Client that signs transactions, when no `organigramClient` is attached. */
    walletClient?: WalletClient | null;
    /** Client used for reads, when no `organigramClient` is attached. */
    publicClient?: PublicClient | null;
    constructor(input?: OrganigramInput | keyof typeof templates | string[]);
    /** Change the name, description or diagram layout. */
    editDetails({ name, description, edgeType, nodePositions }: {
        name?: string;
        description?: string;
        edgeType?: OrganigramEdgeType;
        nodePositions?: OrganigramNodePositions;
        contractAddresses?: string[];
    }): void;
    /** Replace the organs. */
    setOrgans(organs: Organ[]): void;
    /** Replace the assets. */
    setAssets(assets: Asset[]): void;
    /** Replace the procedures. */
    setProcedures(procedures: Procedure[]): void;
    /**
     * Read every deployed organ, procedure and asset of the organigram from chain.
     *
     * @param input - viem clients, used when no `organigramClient` is attached.
     */
    load: (input?: {
        walletClient?: WalletClient | null;
        publicClient?: PublicClient | null;
    }) => Promise<Organigram>;
    /**
     * Deploy every contract of the organigram in one transaction, then read them back from chain.
     *
     * @remarks Requires an attached `organigramClient` with a wallet client.
     */
    deploy(): Promise<Organigram>;
    /** Convert the organigram into plain JSON. */
    toJson: () => OrganigramJson;
}
