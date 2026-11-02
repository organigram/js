import ERC20VoteProcedureContractABI from '@organigram/protocol/abi/ERC20Vote.sol/ERC20VoteProcedure.json' with { type: 'json' };
import { Procedure } from '.';
import { encodeProcedureInitialization, getProcedureType } from './utils';
import { VoteProcedure } from './vote';
import { handleJsonBigInt } from '../utils';
import { parseAbi, zeroAddress } from 'viem';
import { createContractWriteTransaction, getContractInstance } from '../contracts';
const initializeWithRoleModesAbi = parseAbi([
    'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address,uint8[3])'
]);
const initializeWithMemberMajorityAbi = parseAbi([
    'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address,uint8[3],bool)'
]);
const roleModeToContractValue = (mode) => {
    switch (mode) {
        case 'organ':
            return 0;
        case 'token':
            return 1;
        case 'disabled':
            return 2;
    }
};
const contractValueToRoleMode = (mode) => {
    switch (Number(mode)) {
        case 1:
            return 'token';
        case 2:
            return 'disabled';
        default:
            return 'organ';
    }
};
const asBigInt = (value) => {
    if (typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string') {
        return BigInt(value);
    }
    throw new Error('Invalid on-chain numeric value.');
};
export class ERC20VoteProcedure extends VoteProcedure {
    static INTERFACE = '0xc9d27afe';
    erc20;
    proposerMode;
    moderatorMode;
    voterMode;
    requireMemberMajority;
    contract;
    typeName = 'erc20Vote';
    constructor({ erc20, proposerMode, moderatorMode, voterMode, requireMemberMajority, ...voteProcedureArguments }) {
        super({
            ...voteProcedureArguments,
            typeName: 'erc20Vote'
        });
        this.erc20 = erc20;
        this.proposerMode = proposerMode ?? 'organ';
        this.moderatorMode = moderatorMode ?? 'organ';
        this.voterMode = voterMode ?? 'organ';
        this.requireMemberMajority = requireMemberMajority ?? false;
        this.type = getProcedureType(this.chainId, 'erc20Vote');
        this.contract =
            this.publicClient != null
                ? getContractInstance({
                    address: this.address,
                    abi: ERC20VoteProcedureContractABI.abi,
                    publicClient: this.publicClient,
                    walletClient: this.walletClient
                })
                : undefined;
    }
    static async _populateInitialize(input, _clients) {
        const [erc20, quorumSize, voteDuration, majoritySize] = input.args;
        const proposerMode = input.proposerMode;
        const moderatorMode = input.moderatorMode;
        const voterMode = input.voterMode;
        const requireMemberMajority = input.requireMemberMajority ?? false;
        const hasRoleModes = proposerMode != null || moderatorMode != null || voterMode != null || requireMemberMajority;
        return encodeProcedureInitialization(requireMemberMajority
            ? initializeWithMemberMajorityAbi
            : hasRoleModes
                ? initializeWithRoleModesAbi
                : ERC20VoteProcedureContractABI.abi, 'initialize', [
            input.cid,
            input.proposers,
            input.moderators,
            input.deciders,
            input.withModeration,
            input.forwarder,
            Number(quorumSize),
            Number(voteDuration),
            Number(majoritySize),
            erc20,
            ...(hasRoleModes
                ? [
                    [
                        roleModeToContractValue(proposerMode ?? 'organ'),
                        roleModeToContractValue(moderatorMode ?? 'organ'),
                        roleModeToContractValue(voterMode ?? 'organ')
                    ]
                ]
                : []),
            ...(requireMemberMajority ? [true] : [])
        ]);
    }
    static async load(address, clients, initialProcedure) {
        const procedure = await Procedure.load(address, clients, initialProcedure);
        const contract = getContractInstance({
            address,
            abi: ERC20VoteProcedureContractABI.abi,
            publicClient: clients.publicClient,
            walletClient: clients.walletClient
        });
        const erc20 = (await contract.read.tokenContract());
        let proposerMode = 'organ';
        let moderatorMode = 'organ';
        let voterMode = 'organ';
        let requireMemberMajority = false;
        try {
            proposerMode = contractValueToRoleMode(await contract.read.proposerMode());
            moderatorMode = contractValueToRoleMode(await contract.read.moderatorMode());
            voterMode = contractValueToRoleMode(await contract.read.voterMode());
            requireMemberMajority = Boolean(await contract.read.requireMemberMajority());
        }
        catch {
            proposerMode = 'organ';
            moderatorMode = 'organ';
            voterMode = 'organ';
            requireMemberMajority = false;
        }
        const quorumSize = asBigInt(await contract.read.quorumSize());
        const voteDuration = asBigInt(await contract.read.voteDuration());
        const majoritySize = asBigInt(await contract.read.majoritySize());
        const elections = await ERC20VoteProcedure.loadElections(address, clients, procedure.proposals.length);
        const currentBlockTimestamp = asBigInt((await clients.publicClient.getBlock()).timestamp);
        const proposals = procedure.proposals.map(proposal => {
            if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
                const election = elections.find(candidate => candidate.proposalKey === proposal.key);
                if (election?.start) {
                    proposal.blocked =
                        election.approved === false &&
                            BigInt(election.start) + voteDuration <= currentBlockTimestamp;
                }
            }
            return proposal;
        });
        return new ERC20VoteProcedure({
            ...initialProcedure,
            cid: procedure.cid,
            address: procedure.address,
            chainId: procedure.chainId,
            publicClient: clients.publicClient,
            walletClient: clients.walletClient,
            metadata: procedure.metadata,
            proposers: procedure.proposers,
            moderators: procedure.moderators,
            deciders: procedure.deciders,
            withModeration: procedure.withModeration,
            forwarder: procedure.forwarder,
            proposals,
            isDeployed: true,
            erc20: erc20.toString(),
            proposerMode,
            moderatorMode,
            voterMode,
            requireMemberMajority,
            quorumSize: quorumSize.toString(),
            voteDuration: voteDuration.toString(),
            majoritySize: majoritySize.toString(),
            elections,
            data: initialProcedure?.data ??
                JSON.stringify({
                    quorumSize: quorumSize.toString(),
                    voteDuration: voteDuration.toString(),
                    majoritySize: majoritySize.toString(),
                    proposerMode,
                    moderatorMode,
                    voterMode,
                    requireMemberMajority
                })
        });
    }
    async erc20Balance(account) {
        const erc20 = (await this.contract?.read.tokenContract());
        if (erc20 == null || this.publicClient == null) {
            throw new Error('Not connected.');
        }
        const erc20Contract = getContractInstance({
            address: erc20,
            abi: [
                {
                    constant: true,
                    inputs: [{ name: '_owner', type: 'address' }],
                    name: 'balanceOf',
                    outputs: [{ name: 'balance', type: 'uint256' }],
                    type: 'function',
                    stateMutability: 'view'
                }
            ],
            publicClient: this.publicClient,
            walletClient: this.walletClient
        });
        if (this.walletClient == null && account == null) {
            return 0n;
        }
        const resolvedAccount = account ??
            (typeof this.walletClient?.account === 'string'
                ? this.walletClient.account
                : this.walletClient?.account?.address);
        if (resolvedAccount == null)
            return 0n;
        return (await erc20Contract.read.balanceOf([resolvedAccount]));
    }
    async vote(proposalKey, approval, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ERC20VoteProcedureContractABI.abi,
            functionName: 'vote',
            args: [BigInt(proposalKey), approval],
            clients: this.getClients(),
            nonce: options?.nonce
        }).catch((error) => {
            console.error('Error while voting.', this.address, proposalKey, error.message);
            throw error;
        });
        options?.onTransaction?.(tx, 'Initialize ERC20 Vote procedure.');
        await tx.wait();
    }
    toJson = () => JSON.parse(JSON.stringify({
        address: this.address,
        salt: this.salt,
        chainId: this.chainId,
        data: this.data,
        typeName: this.typeName,
        name: this.name,
        description: this.description,
        organigramId: this.organigramId,
        cid: this.cid,
        isDeployed: this.isDeployed,
        deciders: this.deciders,
        proposers: this.proposers,
        moderators: this.moderators ?? zeroAddress,
        withModeration: this.withModeration,
        forwarder: this.forwarder,
        metadata: this.metadata,
        proposals: this.proposals,
        type: this.type,
        erc20: this.erc20,
        proposerMode: this.proposerMode,
        moderatorMode: this.moderatorMode,
        voterMode: this.voterMode,
        quorumSize: this.quorumSize,
        voteDuration: this.voteDuration,
        majoritySize: this.majoritySize,
        elections: this.elections
    }, handleJsonBigInt));
}
