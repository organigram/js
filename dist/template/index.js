import none from './none.json' with { type: 'json' };
import nonProfit from './non-profit.json' with { type: 'json' };
import openSource from './open-source.json' with { type: 'json' };
import participatoryBudget from './budget.json' with { type: 'json' };
import sas from './sas.json' with { type: 'json' };
import sasu from './sasu.json' with { type: 'json' };
import sa from './sa.json' with { type: 'json' };
import sarl from './sarl.json' with { type: 'json' };
import accountingRecords from './accounting-records.json' with { type: 'json' };
import employmentSafetyRecords from './employment-safety-records.json' with { type: 'json' };
import dataProcessingRegister from './data-processing-register.json' with { type: 'json' };
import corporateFilings from './corporate-filings.json' with { type: 'json' };
import { capitalize, createRandom32BytesHexId, PERMISSIONS, predictContractAddress } from '../utils';
import { resolveDeployment } from '../deployments';
export const templates = {
    none,
    nonProfit,
    openSource,
    participatoryBudget,
    sas: sas,
    sasu: sasu,
    sa: sa,
    sarl: sarl,
    accountingRecords,
    employmentSafetyRecords,
    dataProcessingRegister,
    corporateFilings
};
const templateDeploymentRequirements = {
    sas: ['EquityToken'],
    sasu: ['EquityToken'],
    sa: ['EquityToken'],
    sarl: ['EquityToken']
};
/** Returns whether every protocol implementation required by a template exists on a chain. */
export const isTemplateSupportedOnChain = (templateName, chainId) => (templateDeploymentRequirements[templateName] ?? []).every(deploymentName => resolveDeployment(chainId, deploymentName) != null);
const permissionValuesByKey = new Map(Object.entries(PERMISSIONS));
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
                : item.kind === 'equity'
                    ? 'EquityToken'
                    : type,
            chainId,
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
const resolvePermissionValue = (permission) => {
    if (typeof permission.permissionValue === 'number') {
        return permission.permissionValue;
    }
    return (permission.permissionKeys ?? []).reduce((value, key) => {
        const permissionValue = permissionValuesByKey.get(key);
        return typeof permissionValue === 'number' ? value | permissionValue : value;
    }, 0);
};
const normalizeOrganPermission = (permission, procedureRenewal, assetRenewal) => {
    const permissionReference = permission.permissionAddress ?? permission.procedureSalt;
    const permissionAddress = resolveRenewedAddress(permissionReference, procedureRenewal) ||
        resolveRenewedAddress(permissionReference, assetRenewal);
    const permissionValue = resolvePermissionValue(permission);
    if (permissionAddress === '' || permissionValue <= 0) {
        return undefined;
    }
    return {
        permissionAddress,
        permissionValue
    };
};
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
            ?.map(permission => normalizeOrganPermission(permission, procedureRenewal, assetRenewal))
            .filter((permission) => permission != null)
    }));
    const procedures = procedureRenewal.values.map(({ item: procedure, salt, address }) => ({
        ...procedure,
        salt,
        chainId,
        data: (() => {
            const data = JSON.parse(procedure.data ?? '{}');
            return JSON.stringify({
                ...data,
                ...(typeof data.erc20 === 'string'
                    ? { erc20: resolveRenewedAddress(data.erc20, assetRenewal) }
                    : {}),
                ...(typeof data.equityTransferRegister === 'string'
                    ? {
                        equityTransferRegister: resolveRenewedAddress(data.equityTransferRegister, organRenewal)
                    }
                    : {}),
            });
        })(),
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
        address,
        decisionProcedure: asset.kind === 'equity'
            ? resolveRenewedAddress(asset.decisionProcedure, procedureRenewal)
            : asset.decisionProcedure
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
