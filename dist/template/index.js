import none from './none.json' with { type: 'json' };
import forProfit from './for-profit.json' with { type: 'json' };
import nonProfit from './non-profit.json' with { type: 'json' };
import openSource from './open-source.json' with { type: 'json' };
import participatoryBudget from './budget.json' with { type: 'json' };
import { capitalize, createRandom32BytesHexId, predictContractAddress } from '../utils';
export const templates = {
    none,
    forProfit,
    nonProfit,
    openSource,
    participatoryBudget
};
const setFirstValue = (target, key, value) => {
    if (key != null && key !== '' && target[key] == null) {
        target[key] = value;
    }
};
const createRenewedContractValues = (items, type, chainId) => {
    const values = items?.map(item => {
        const salt = createRandom32BytesHexId();
        const address = predictContractAddress({
            type: type === 'Procedure'
                ? (capitalize(item.typeName) + type)
                : type,
            chainId: item.chainId ?? chainId,
            salt
        });
        return {
            item,
            salt,
            address
        };
    }) ?? [];
    const salts = {};
    const addresses = {};
    const addressBySalt = {};
    for (const value of values) {
        setFirstValue(salts, value.item.salt, value.salt);
        setFirstValue(addresses, value.item.address, value.address);
        setFirstValue(addressBySalt, value.item.salt, value.address);
    }
    return {
        values,
        salts,
        addresses,
        addressBySalt
    };
};
const resolveRenewedAddress = (reference, renewal) => reference == null
    ? ''
    : (renewal.addresses[reference] ?? renewal.addressBySalt[reference] ?? '');
export const renewSaltsAndAddresses = (organigram, chainId) => {
    const organRenewal = createRenewedContractValues(organigram.organs, 'Organ', chainId);
    const assetRenewal = createRenewedContractValues(organigram.assets, 'Asset', chainId);
    const procedureRenewal = createRenewedContractValues(organigram.procedures, 'Procedure', chainId);
    const organs = organRenewal.values.map(({ item: organ, salt, address }) => ({
        ...organ,
        salt,
        address,
        chainId,
        isDeployed: false,
        permissions: organ.permissions
            ?.map(permission => ({
            ...permission,
            permissionAddress: resolveRenewedAddress(permission.permissionAddress, procedureRenewal)
        }))
            .filter((permission) => permission.permissionAddress !== '')
    }));
    const procedures = procedureRenewal.values.map(({ item: procedure, salt, address }) => ({
        ...procedure,
        salt,
        chainId,
        data: JSON.parse(procedure.data ?? '{}').erc20
            ? JSON.stringify({
                erc20: resolveRenewedAddress(JSON.parse(procedure.data).erc20, assetRenewal),
                quorumSize: JSON.parse(procedure.data).quorumSize,
                voteDuration: JSON.parse(procedure.data).voteDuration,
                majoritySize: JSON.parse(procedure.data).majoritySize
            })
            : (procedure.data ?? '{}'),
        isDeployed: false,
        address,
        deciders: resolveRenewedAddress(procedure.deciders, organRenewal),
        proposers: resolveRenewedAddress(procedure.proposers, organRenewal),
        moderators: procedure.moderators
            ? resolveRenewedAddress(procedure.moderators, organRenewal)
            : undefined
    }));
    const assets = assetRenewal.values.map(({ item: asset, salt, address }) => ({
        ...asset,
        chainId,
        isDeployed: false,
        salt,
        address
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
