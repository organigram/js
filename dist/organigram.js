import OrganigramClient from './organigramClient';
import { getTemplate, templates } from './template';
import { getDefaultChainId } from './deployments';
import { handleJsonBigInt } from './utils';
/** Line styles available to draw the links of an organigram. */
export const organigramEdgeTypes = [
    'default',
    'straight',
    'step',
    'smoothstep'
    // 'simplebezier'
];
/** Line style used when none is set. */
export const defaultOrganigramEdgeType = 'default';
export const normalizeOrganigramEdgeType = (edgeType) => organigramEdgeTypes.includes(edgeType)
    ? edgeType
    : defaultOrganigramEdgeType;
export const normalizeOrganigramNodePositions = (nodePositions) => {
    if (nodePositions == null || typeof nodePositions !== 'object') {
        return {};
    }
    return Object.fromEntries(Object.entries(nodePositions).flatMap(([key, value]) => {
        if (value != null &&
            typeof value === 'object' &&
            typeof value.x === 'number' &&
            Number.isFinite(value.x) &&
            typeof value.y === 'number' &&
            Number.isFinite(value.y)) {
            return [[key, { x: value.x, y: value.y }]];
        }
        return [];
    }));
};
/** Chain used by templates when none is given. */
export const defaultChainId = getDefaultChainId();
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
export class Organigram {
    /** Identifier of the organigram. */
    id;
    /** Organs of the organization. */
    organs = [];
    /** Assets of the organization. */
    assets = [];
    /** Procedures connecting the organs. */
    procedures = [];
    /** Chain the organigram is deployed on. */
    chainId;
    /** URL-friendly name. */
    slug;
    /** Display name. */
    name;
    /** Free description. */
    description;
    /** Line style of the diagram links. */
    edgeType;
    /** Positions of the diagram nodes. */
    nodePositions;
    /** Workspace the organigram belongs to in the Organigram app. */
    workspaceId;
    /** Client used to deploy and load the organigram. */
    organigramClient;
    /** Client that signs transactions, when no `organigramClient` is attached. */
    walletClient;
    /** Client used for reads, when no `organigramClient` is attached. */
    publicClient;
    constructor(input) {
        let resolvedOrganigram;
        if (input == null) {
            resolvedOrganigram = getTemplate('none', defaultChainId);
        }
        else if (typeof input === 'string' && input in templates) {
            resolvedOrganigram = getTemplate(input, defaultChainId);
        }
        else if (typeof input === 'object' && Array.isArray(input)) {
            resolvedOrganigram = undefined;
        }
        else {
            resolvedOrganigram = input;
        }
        const initial = resolvedOrganigram;
        this.name = initial?.name ?? 'Blank project';
        this.description = initial?.description ?? 'This is the default organigram.';
        this.edgeType = normalizeOrganigramEdgeType(initial?.edgeType);
        this.nodePositions = normalizeOrganigramNodePositions(initial?.nodePositions);
        this.id = initial?.id ?? crypto.randomUUID();
        this.slug = initial?.slug ?? this.id;
        this.organs = initial?.organs ?? [];
        this.procedures = initial?.procedures ?? [];
        this.assets = initial?.assets ?? [];
        this.chainId = initial?.chainId ?? defaultChainId;
        this.organigramClient = initial?.organigramClient;
        this.walletClient = initial?.walletClient;
        this.publicClient = initial?.publicClient;
        this.workspaceId = initial?.workspaceId;
    }
    /** Change the name, description or diagram layout. */
    editDetails({ name, description, edgeType, nodePositions }) {
        if (name !== undefined)
            this.name = name;
        if (description !== undefined)
            this.description = description;
        if (edgeType !== undefined)
            this.edgeType = edgeType;
        if (nodePositions !== undefined)
            this.nodePositions = nodePositions;
    }
    /** Replace the organs. */
    setOrgans(organs) {
        this.organs = organs;
    }
    /** Replace the assets. */
    setAssets(assets) {
        this.assets = assets;
    }
    /** Replace the procedures. */
    setProcedures(procedures) {
        this.procedures = procedures;
    }
    /**
     * Read every deployed organ, procedure and asset of the organigram from chain.
     *
     * @param input - viem clients, used when no `organigramClient` is attached.
     */
    load = async (input) => {
        const publicClient = input?.publicClient ??
            this.publicClient ??
            this.organigramClient?.publicClient;
        const walletClient = input?.walletClient ?? this.walletClient;
        if (!this.organigramClient && publicClient == null) {
            throw new Error('Cannot load organigram: neither Organigram client or public client are set.');
        }
        if ([...this.procedures, ...this.organs, ...this.assets].every(item => item.isDeployed !== true)) {
            return this;
        }
        const client = this.organigramClient ??
            (await OrganigramClient.load({
                publicClient: publicClient,
                walletClient: walletClient ?? undefined
            }));
        return await client.loadOrganigram(this);
    };
    /**
     * Deploy every contract of the organigram in one transaction, then read them back from chain.
     *
     * @remarks Requires an attached `organigramClient` with a wallet client.
     */
    async deploy() {
        if (!this.organigramClient) {
            throw new Error('Organigram client not set.');
        }
        const deployment = await this.organigramClient.deployOrganigram(this);
        const deployedOrganigram = deployment.organigram;
        this.setOrgans(deployedOrganigram.organs);
        this.setAssets(deployedOrganigram.assets);
        this.setProcedures(deployedOrganigram.procedures);
        return await this.load();
    }
    /** Convert the organigram into plain JSON. */
    toJson = () => JSON.parse(JSON.stringify({
        id: this.id,
        slug: this.slug,
        workspaceId: this.workspaceId,
        chainId: this.chainId,
        name: this.name,
        description: this.description,
        edgeType: this.edgeType,
        nodePositions: this.nodePositions,
        organs: this.organs.map(organ => organ.toJson?.() ?? organ),
        assets: this.assets.map(asset => asset.toJson?.() ?? asset),
        procedures: this.procedures.map(procedure => procedure.toJson?.() ?? procedure)
    }, handleJsonBigInt));
}
