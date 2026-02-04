import { getTemplate, templates } from './template';
export const getProcedureSourcesAndTargets = (procedure, organigram) => {
    if (procedure.sourceOrgans && procedure.targetOrgans) {
        return procedure;
    }
    const sourceOrgans = [
        procedure.deciders,
        procedure.proposers,
        procedure.moderators
    ]
        .filter((address) => address != null)
        .map(address => ({
        procedureAddress: procedure.address,
        organAddress: address
    }));
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
    organs = [];
    procedures = [];
    assets = [];
    chainId;
    id;
    name;
    description;
    client;
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
        this.id = initTyped?.id;
        this.organs = initTyped?.organs;
        this.procedures = initTyped?.procedures;
        this.assets = initTyped?.assets;
        this.chainId = initTyped?.chainId ?? defaultChainId;
        this.client = initTyped?.client;
        this.signer = initTyped?.signer;
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
        this.client?.loadOrganigram(this, undefined, options);
    };
    async deploy(signer) {
        const deployArgument = makeOrganigramDeployArgument(this, signer);
        return await this.client
            ?.deployOrganigram(deployArgument)
            .then(async () => await this?.load());
    }
    toJson = () => JSON.stringify({
        id: this.id,
        name: this.name,
        description: this.description,
        organs: this.organs,
        procedures: this.procedures,
        assets: this.assets
    });
}
