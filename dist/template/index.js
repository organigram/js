import none from './none.json';
import { capitalize, createRandom32BytesHexId, predictContractAddress } from '../utils';
export const templates = {
    none
};
const renewSalts = (pv, cv) => Object.assign(pv, { [cv.salt]: createRandom32BytesHexId() });
const renewAddresses = (salts, type, chainId) => (pv, cv) => Object.assign(pv, {
    [cv.address]: predictContractAddress({
        type: type === 'Procedure'
            ? (capitalize(cv.typeName) + type)
            : type,
        chainId: cv.chainId ?? chainId,
        salt: salts[cv.salt]
    })
});
export const renewSaltsAndAddresses = (organigram, chainId) => {
    const newOrganSalts = organigram.organs?.reduce((renewSalts), {}) ?? {};
    const newAssetSalts = organigram.assets?.reduce((renewSalts), {}) ?? {};
    const newProcedureSalts = organigram.procedures?.reduce((renewSalts), {}) ?? {};
    const newOrganAddresses = organigram.organs?.reduce(renewAddresses(newOrganSalts, 'Organ', chainId), {}) ?? {};
    const newAssetAddresses = organigram.assets?.reduce(renewAddresses(newAssetSalts, 'Asset', chainId), {}) ?? {};
    const newProcedureAddresses = organigram.procedures?.reduce(renewAddresses(newProcedureSalts, 'Procedure', chainId), {}) ?? {};
    const organs = organigram.organs?.map(organ => ({
        ...organ,
        salt: newOrganSalts[organ.salt],
        address: newOrganAddresses[organ.address],
        chainId,
        permissions: organ.permissions?.map(permission => ({
            ...permission,
            permissionAddress: newProcedureAddresses[permission.permissionAddress]
        }))
    }));
    const procedures = organigram.procedures?.map(procedure => ({
        ...procedure,
        salt: newProcedureSalts[procedure.salt],
        chainId,
        address: newProcedureAddresses[procedure.address],
        deciders: newOrganAddresses[procedure.deciders],
        proposers: newOrganAddresses[procedure.proposers],
        moderators: procedure.moderators
            ? newOrganAddresses[procedure.moderators]
            : undefined
    }));
    const assets = organigram.assets?.map(asset => ({
        ...asset,
        chainId,
        salt: newAssetSalts[asset.salt],
        address: newAssetAddresses[asset.address]
    }));
    return {
        ...organigram,
        chainId,
        organs,
        procedures,
        assets
    };
};
export const getTemplate = (templateName, chainId) => renewSaltsAndAddresses(templates[templateName], chainId);
