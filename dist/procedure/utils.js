import { createRandom32BytesHexId, formatSalt } from '../utils';
import { getDefaultChainId, getDeployment } from '../deployments';
import { encodeFunctionData, isAddress, padHex, toHex, zeroAddress } from 'viem';
export var ProcedureTypeNameEnum;
(function (ProcedureTypeNameEnum) {
    ProcedureTypeNameEnum["erc20Vote"] = "erc20Vote";
    ProcedureTypeNameEnum["nomination"] = "nomination";
    ProcedureTypeNameEnum["vote"] = "vote";
})(ProcedureTypeNameEnum || (ProcedureTypeNameEnum = {}));
const encodeDynamicFunctionData = encodeFunctionData;
export const electionFields = {
    quorumSize: {
        name: 'quorumSize',
        label: 'Quorum size',
        description: 'Size of the quorum required to start a vote. Accepts a percentage of the total of voters, with three decimals precision. Default: 20.001%',
        defaultValue: '20001',
        type: 'number'
    },
    voteDuration: {
        name: 'voteDuration',
        label: 'Vote duration',
        description: 'Duration of the vote phase, as a number of seconds. Default: 3600 seconds (1 hour)',
        defaultValue: '3600',
        type: 'number'
    },
    majoritySize: {
        name: 'majoritySize',
        label: 'Majority size',
        description: 'Size of the majority required to pass a proposal. Accepts a percentage of the total of voters, with three decimals precision. Default: 50.001%',
        defaultValue: '50001',
        type: 'number'
    }
};
export const procedureMetadata = {
    _type: 'procedureType',
    _generator: 'https://organigram.ai',
    _generatedAt: 0
};
export const procedureTypeMetadata = {
    erc20Vote: {
        key: 'erc20Vote',
        fields: {
            ...electionFields,
            erc20: {
                name: 'erc20',
                label: 'ERC20 Token',
                description: 'Address of the ERC20 Token used for weighting the voting power.',
                defaultValue: '',
                type: 'string'
            }
        },
        metadata: {
            ...procedureMetadata,
            label: 'Token-weighted Vote',
            description: 'A token vote allows any member in the source organ to vote on proposals, where their voting power is based on the amount of tokens they hold.',
            type: 'erc20Vote'
        }
    },
    nomination: {
        key: 'nomination',
        fields: {},
        metadata: {
            label: 'Nomination',
            description: 'A nomination allows any member in the source organ to directly edit entries, assets or permissions in the target organ.'
        }
    },
    vote: {
        key: 'vote',
        fields: electionFields,
        metadata: {
            label: 'Simple Majority Vote',
            description: 'A vote allows any user in the source organ to vote on proposals to add, edit or replace one or many entries, assets or permissions in the target organ.'
        }
    }
};
const procedureTypeDeploymentNames = {
    erc20Vote: 'ERC20VoteProcedure',
    nomination: 'NominationProcedure',
    vote: 'VoteProcedure'
};
const buildProcedureType = (chainId, typeName) => ({
    ...procedureTypeMetadata[typeName],
    address: getDeployment(chainId, procedureTypeDeploymentNames[typeName])
});
export const getProcedureTypes = (chainId = getDefaultChainId()) => ({
    erc20Vote: buildProcedureType(chainId, 'erc20Vote'),
    nomination: buildProcedureType(chainId, 'nomination'),
    vote: buildProcedureType(chainId, 'vote')
});
export const getProcedureType = (chainId, typeName) => getProcedureTypes(chainId)[typeName];
export const procedureTypes = getProcedureTypes();
export const prepareDeployOrgansInput = (deployOrgansInput) => deployOrgansInput.map(organ => {
    const permissionAddresses = [];
    const permissionValues = [];
    organ.permissions?.forEach(permission => {
        permissionAddresses.push(permission.permissionAddress);
        permissionValues.push(padHex(toHex(permission.permissionValue), { size: 2 }));
    });
    const entries = organ.entries?.map((entry) => ({
        addr: entry.address,
        cid: entry.cid ?? ''
    })) ?? [];
    return {
        permissionAddresses,
        permissionValues,
        cid: organ.cid ?? '',
        entries,
        salt: organ.salt ?? createRandom32BytesHexId()
    };
});
export const prepareDeployProceduresInput = async (deployProceduresInput, clients) => await Promise.all(deployProceduresInput.map(async (procedure) => {
    if (procedure.typeName !== 'nomination' &&
        procedure.data == null &&
        procedure.args == null) {
        throw new Error('At least one of "data" or "args" fields must be present in ' +
            procedure.typeName +
            ' procedure input.');
    }
    const parsedData = procedure.data ? JSON.parse(procedure.data) : {};
    const rawArgs = procedure.args ?? Object.values(parsedData);
    const initialize = await populateInitializeProcedure({
        typeName: procedure.typeName,
        options: procedure.options ?? {},
        cid: procedure.cid ?? '',
        moderators: procedure.moderators ?? zeroAddress,
        deciders: procedure.deciders,
        proposers: procedure.proposers ?? procedure.deciders,
        withModeration: procedure.withModeration ?? false,
        forwarder: procedure.forwarder ??
            getDeployment(procedure.chainId ?? getDefaultChainId(), 'MetaGasStation'),
        args: rawArgs.map(arg => typeof arg === 'string'
            ? isAddress(arg) || arg.startsWith('0x')
                ? arg
                : /^-?\d+$/.test(arg)
                    ? toHex(BigInt(arg))
                    : toHex(arg)
            : arg)
    }, clients);
    return {
        procedureType: getProcedureType(procedure.chainId ?? getDefaultChainId(), procedure.typeName).address,
        data: initialize.data,
        salt: formatSalt(procedure.salt),
        options: procedure.options
    };
}));
export const getProcedureClass = async (typeName) => {
    try {
        let procedureClass;
        switch (typeName) {
            case 'erc20Vote':
                procedureClass = (await import('./erc20Vote')).ERC20VoteProcedure;
                break;
            case 'nomination':
                procedureClass = (await import('./nomination')).NominationProcedure;
                break;
            case 'vote':
                procedureClass = (await import('./vote')).VoteProcedure;
                break;
            default:
                throw new Error('Procedure type not found: ' + typeName);
        }
        return procedureClass;
    }
    catch (error) {
        console.error('getProcedureClass', error.message);
        throw error;
    }
};
export const populateInitializeProcedure = async (input, clients) => {
    if (clients.walletClient == null) {
        throw new Error('Wallet client not connected.');
    }
    const procedureClass = await getProcedureClass(input.typeName);
    try {
        return await procedureClass._populateInitialize(input, clients);
    }
    catch (error) {
        console.error('populateInitializeProcedure', error.message);
        throw error;
    }
};
export const encodeProcedureInitialization = (abi, functionName, args) => ({
    data: encodeDynamicFunctionData({
        abi,
        functionName,
        args
    })
});
