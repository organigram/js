import { getTemplate, templates } from './template';
export const sourceOrganTypes = [
    { label: 'Create proposals', name: 'proposers' },
    { label: 'Approve proposals', name: 'deciders' },
    { label: 'Filter proposals', name: 'moderators' }
];
export const getProcedureSourcesAndTargets = (procedure, organigram) => {
    if (procedure.sourceOrgans && procedure.targetOrgans) {
        return procedure;
    }
    const sources = Array.from(new Set([procedure.deciders, procedure.proposers, procedure.moderators].filter(Boolean)));
    const sourceOrgans = sources.reduce((acc, source) => {
        if (acc.some(sourceOrgan => sourceOrgan.organAddress === source)) {
            return acc.map(sourceOrgan => {
                if (sourceOrgan.organAddress === source) {
                    return {
                        ...sourceOrgan,
                        types: [
                            ...(sourceOrgan.types ?? []),
                            ...(procedure.proposers === source ? ['proposers'] : []),
                            ...(procedure.deciders === source ? ['deciders'] : []),
                            ...(procedure.moderators === source ? ['moderators'] : [])
                        ]
                    };
                }
                return sourceOrgan;
            });
        }
        const organ = organigram.organs.find(organ => organ.address === source);
        if (organ) {
            return [
                ...acc,
                {
                    organAddress: organ.address,
                    procedureAddress: procedure.address,
                    types: [
                        ...(procedure.proposers === source ? ['proposers'] : []),
                        ...(procedure.deciders === source ? ['deciders'] : []),
                        ...(procedure.moderators === source ? ['moderators'] : [])
                    ]
                }
            ];
        }
        return acc;
    }, []);
    const targetOrgans = organigram.organs
        .filter(organ => organ.permissions?.some(permission => permission.permissionAddress === procedure.address))
        ?.map(organ => ({
        permissionValue: organ.permissions.find(permission => permission.permissionAddress === procedure.address).permissionValue,
        procedureAddress: procedure.address,
        organAddress: organ.address
    }));
    return {
        ...procedure,
        sourceOrgans,
        targetOrgans
    };
};
export const getOrganSourcesAndTargets = (organ, organigram) => {
    if (organ.isSource || organ.isTarget) {
        return organ;
    }
    const isSource = organigram.procedures
        .filter(procedure => procedure.deciders === organ.address ||
        procedure.proposers === organ.address ||
        procedure.moderators === organ.address)
        .map(procedure => ({
        procedureAddress: procedure.address,
        organAddress: organ.address
    }));
    const isTarget = organ.permissions?.map(permission => ({
        permissionValue: permission.permissionValue,
        procedureAddress: permission.permissionAddress,
        organAddress: organ.address
    }));
    return {
        ...organ,
        isSource,
        isTarget
    };
};
export const getAssetSourcesAndTargets = (asset, organigram) => {
    if (asset.isSourceOrgan) {
        return asset;
    }
    const isSource = organigram.procedures
        .filter(procedure => procedure.deciders === asset.address ||
        procedure.proposers === asset.address ||
        procedure.moderators === asset.address)
        .map(procedure => ({
        procedureAddress: procedure.address,
        assetAddress: asset.address
    }));
    return {
        ...asset,
        isSourceOrgan: isSource
    };
};
export const getSourcesAndTargets = (initialOrganigram) => {
    const organs = initialOrganigram.organs?.map(organ => getOrganSourcesAndTargets(organ, initialOrganigram));
    const procedures = initialOrganigram.procedures?.map(procedure => getProcedureSourcesAndTargets(procedure, initialOrganigram));
    const assets = initialOrganigram.assets?.map(asset => getAssetSourcesAndTargets(asset, initialOrganigram));
    return { ...initialOrganigram, organs, procedures, assets };
};
export const makeOrganigramDeployArgument = (organigram, signer) => {
    return {};
};
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
            _organigram = getSourcesAndTargets(input);
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
    load = async (options = {
        discover: true,
        limit: 100
    }) => {
        this.organigramClient?.loadOrganigram(this, undefined, options);
    };
    async deploy() {
        if (!this.organigramClient) {
            throw new Error('Organigram client not set.');
        }
        return await this.organigramClient.deployOrganigram(this);
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
    }));
}
