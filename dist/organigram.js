import OrganigramClient from './organigramClient';
import { getTemplate, templates } from './template';
import { getDefaultChainId } from './deployments';
import { handleJsonBigInt } from './utils';
/**
 * Human-readable labels for the procedure role slots expected by the protocol.
 */
export const procedureRoleTypes = [
    { label: 'Create proposals', name: 'proposers' },
    { label: 'Approve proposals', name: 'deciders' },
    { label: 'Filter proposals', name: 'moderators' }
];
export const organigramEdgeTypes = [
    'default',
    'straight',
    'step',
    'smoothstep'
    // 'simplebezier'
];
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
/**
 * Default chain id used by the SDK templates.
 */
export const defaultChainId = getDefaultChainId();
/**
 * In-memory representation of an Organigram project.
 *
 * The class can be created from raw inputs, a built-in template name, or left
 * blank to start from the default empty template.
 */
export class Organigram {
    id;
    organs = [];
    assets = [];
    procedures = [];
    chainId;
    slug;
    name;
    description;
    edgeType;
    nodePositions;
    workspaceId;
    organigramClient;
    walletClient;
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
    setOrgans(organs) {
        this.organs = organs;
    }
    setAssets(assets) {
        this.assets = assets;
    }
    setProcedures(procedures) {
        this.procedures = procedures;
    }
    /**
     * Hydrate every deployed object referenced by this organigram.
     *
     * @param input Optional viem clients used when the organigram has no attached client yet.
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
     * Deploy the full organigram through its attached client, then reload it from chain state.
     */
    async deploy() {
        if (!this.organigramClient) {
            throw new Error('Organigram client not set.');
        }
        return await this.organigramClient
            .deployOrganigram(this)
            .then(async () => await this.load());
    }
    /**
     * Convert the organigram into a JSON-safe structure suitable for persistence or transport.
     */
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
