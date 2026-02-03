export const getSourcesAndTargets = (initialOrganigram) => {
    return initialOrganigram;
};
export const getProcedureSourcesAndTargets = (procedure) => {
    return procedure;
};
export const getOrganSourcesAndTargets = (organ) => {
    return organ;
};
export const getAssetSourcesAndTargets = (asset) => {
    return asset;
};
export const makeOrganigramDeployArgument = (organigram, signer) => {
    return {};
};
export class Organigram {
    id;
    name;
    description;
    organs = [];
    procedures = [];
    assets = [];
    client;
    signer;
    constructor(initialOrganigram) {
        this.name = initialOrganigram.name;
        this.description = initialOrganigram.description;
        this.id = initialOrganigram.id;
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
