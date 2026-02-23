import OrganigramClient from './organigramClient';
import { getTemplate, templates } from './template';
import { handleJsonBigInt } from './utils';
export const procedureRoleTypes = [
    { label: 'Create proposals', name: 'proposers' },
    { label: 'Approve proposals', name: 'deciders' },
    { label: 'Filter proposals', name: 'moderators' }
];
export const defaultChainId = '11155111';
export class Organigram {
    id;
    organs = [];
    assets = [];
    procedures = [];
    chainId;
    slug;
    name;
    description;
    workspaceId;
    organigramClient;
    signer;
    constructor(input) {
        let _organigram;
        if (input == null) {
            _organigram = getTemplate('none', defaultChainId);
        }
        else if (typeof input === 'string' && input in templates) {
            _organigram = getTemplate(input, defaultChainId);
        }
        else if (typeof input === 'object' && Array.isArray(input)) {
        }
        else
            _organigram = input;
        const initTyped = _organigram;
        this.name = initTyped?.name ?? 'Blank project';
        this.description =
            initTyped?.description ?? 'This is the default organigram.';
        this.id = initTyped?.id ?? crypto.randomUUID();
        this.slug = initTyped?.slug ?? this.id;
        this.organs = initTyped?.organs ?? [];
        this.procedures = initTyped?.procedures ?? [];
        this.assets = initTyped?.assets ?? [];
        this.chainId = initTyped?.chainId ?? defaultChainId;
        this.organigramClient = initTyped?.organigramClient;
        this.signer = initTyped?.signer;
        this.workspaceId = initTyped?.workspaceId;
    }
    editDetails({ name, description }) {
        if (name !== undefined)
            this.name = name;
        if (description !== undefined)
            this.description = description;
    }
    setOrgans(organs) { }
    setAssets(assets) { }
    setProcedures(procedures) { }
    load = async (input) => {
        const { signer } = input ?? {};
        if (!this.organigramClient && !this.signer && !signer) {
            throw new Error('Cannot load organigram: neither Organigram client or signer are set.');
        }
        if ([...this.procedures, ...this.organs, ...this.assets].every(item => item.isDeployed !== true)) {
            return this;
        }
        const provider = signer?.provider ?? this.signer?.provider;
        if (provider == null) {
            throw new Error('Cannot load organigram: signer/provider is missing a provider.');
        }
        const client = this.organigramClient ??
            (await OrganigramClient.load({
                signer: signer ?? this.signer,
                provider
            }));
        return await client.loadOrganigram(this);
    };
    async deploy() {
        if (!this.organigramClient) {
            throw new Error('Organigram client not set.');
        }
        return await this.organigramClient
            .deployOrganigram(this)
            .then(async () => await this?.load());
    }
    toJson = () => JSON.parse(JSON.stringify({
        id: this.id,
        slug: this.slug,
        workspaceId: this.workspaceId,
        chainId: this.chainId,
        name: this.name,
        description: this.description,
        organs: this.organs.map(organ => organ.toJson?.() ?? organ),
        assets: this.assets.map(asset => asset.toJson?.() ?? asset),
        procedures: this.procedures.map(procedure => procedure.toJson?.() ?? procedure)
    }, handleJsonBigInt));
}
