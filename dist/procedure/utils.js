import { ethers } from 'ethers';
import { erc20Vote, ERC20VoteProcedure } from './erc20Vote';
import { nomination, NominationProcedure } from './nomination';
import { vote, VoteProcedure } from './vote';
import { createRandom32BytesHexId, deployedAddresses, formatSalt } from '../utils';
export const procedureTypes = {
    erc20Vote,
    nomination,
    vote
};
export const procedureClasses = {
    erc20Vote: ERC20VoteProcedure,
    nomination: NominationProcedure,
    vote: VoteProcedure
};
export const prepareDeployOrgansInput = (deployOrgansInput) => deployOrgansInput.map(organ => {
    const _permissionAddresses = [];
    const _permissionValues = [];
    organ.permissions?.forEach(p => {
        _permissionAddresses.push(p.permissionAddress);
        _permissionValues.push(ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2));
    });
    const entries = organ.entries?.map((e) => ({
        addr: e.address,
        cid: e.cid ?? ''
    })) ?? [];
    return {
        permissionAddresses: _permissionAddresses,
        permissionValues: _permissionValues,
        cid: organ.cid ?? '',
        entries,
        salt: organ.salt ?? createRandom32BytesHexId()
    };
});
export const prepareDeployProceduresInput = async (deployProceduresInput, signer) => await Promise.all(deployProceduresInput.map(async (procedure) => {
    if (procedure.typeName !== 'nomination' &&
        procedure.data == null &&
        procedure.args == null) {
        throw new Error('At least one of "data" or "args" fields must be present in ' +
            procedure.typeName +
            ' procedure input.');
    }
    const parsedData = procedure.data ? JSON.parse(procedure.data) : {};
    const _args = procedure.args ?? Object.values(parsedData);
    const initialize = await populateInitializeProcedure({
        typeName: procedure.typeName,
        options: procedure.options ?? {},
        cid: procedure.cid ?? procedure.typeName,
        moderators: procedure.moderators ?? ethers.ZeroAddress,
        deciders: procedure.deciders,
        proposers: procedure.proposers ?? procedure.deciders,
        withModeration: procedure.withModeration ?? false,
        forwarder: procedure.forwarder ??
            deployedAddresses[procedure.chainId]?.MetaGasStation,
        args: _args
    }, signer);
    return {
        procedureType: procedureTypes[procedure.typeName]
            .address,
        data: initialize.data,
        salt: formatSalt(procedure.salt),
        options: procedure.options
    };
}));
export const populateInitializeProcedure = async (input, signer) => {
    if (signer == null) {
        throw new Error('Signer not connected.');
    }
    const procedureClass = procedureClasses[input.typeName];
    if (procedureClass == null) {
        throw new Error('Populate initialize procedure: Procedure type not found.');
    }
    try {
        const chainId = await signer.provider
            ?.getNetwork()
            .then(n => n.chainId.toString());
        return await procedureClass._populateInitialize({
            options: { ...input.options, signer },
            cid: input.cid ?? input.typeName,
            proposers: input.proposers ?? input.deciders,
            moderators: input.moderators ?? ethers.ZeroAddress,
            deciders: input.deciders,
            withModeration: input.withModeration ?? false,
            forwarder: input.forwarder ??
                deployedAddresses[chainId]?.MetaGasStation,
            args: input.args
        });
    }
    catch (error) {
        console.error('populateInitializeProcedure', error.message);
        throw error;
    }
};
