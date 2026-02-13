import { ethers } from 'ethers';
import { Procedure, procedureMetadata } from '.';
import ERC20VoteProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/ERC20Vote.sol/ERC20VoteProcedure.json';
import { electionFields } from './vote';
import { deployedAddresses } from '../utils';
export const erc20Vote = {
    address: deployedAddresses[11155111].ERC20VoteProcedure,
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
        cid: 'erc20Vote',
        label: 'Token-weighted Vote',
        description: 'A token vote allows any user in the source organ to vote on proposals, where its voting power is based on the amount of tokens it holds.',
        type: 'erc20Vote'
    }
};
export class ERC20VoteProcedure extends Procedure {
    static INTERFACE = '0xc9d27afe';
    erc20;
    quorumSize;
    voteDuration;
    majoritySize;
    elections;
    contract;
    type = erc20Vote;
    typeName = 'erc20Vote';
    constructor({ erc20, quorumSize, voteDuration, majoritySize, elections, ...procedureArguments }) {
        super({ ...procedureArguments, typeName: 'erc20Vote', type: erc20Vote });
        this.erc20 = erc20;
        this.quorumSize = quorumSize;
        this.voteDuration = voteDuration;
        this.majoritySize = majoritySize;
        this.elections = elections;
        this.contract = new ethers.Contract(this.address, ERC20VoteProcedureContractABI.abi, procedureArguments.signerOrProvider);
    }
    static async _populateInitialize(input) {
        if (input.options?.signer == null) {
            throw new Error('Not connected.');
        }
        const [erc20, quorumSize, voteDuration, majoritySize] = input.args;
        const contract = new ethers.Contract(erc20Vote.address, ERC20VoteProcedureContractABI.abi, input.options.signer);
        return await contract.initialize.populateTransaction(input.cid, input.proposers, input.moderators, input.deciders, input.withModeration, input.forwarder, erc20, quorumSize, voteDuration, majoritySize);
    }
    static async loadElection(address, proposalKey, signerOrProvider) {
        const contract = new ethers.Contract(address, ERC20VoteProcedureContractABI.abi, signerOrProvider);
        const election = await contract.getElection(proposalKey);
        if (!election.start)
            throw new Error('Election not found.');
        const voteDuration = await contract.voteDuration();
        const approved = parseInt(voteDuration) + parseInt(election.start) < Date.now() / 1000
            ? await contract.count(proposalKey).catch((error) => {
                console.warn('Error while counting votes.', address, proposalKey, error.message);
                return false;
            })
            : false;
        return {
            proposalKey,
            start: election.start.toString(),
            votesCount: election.votesCount.toString(),
            hasVoted: election.hasVoted,
            approved
        };
    }
    static async loadElections(address, signerOrProvider) {
        const data = await Procedure.loadData(address, signerOrProvider);
        const proposalsLength = BigInt(data.proposalsLength);
        const elections = [];
        for (let i = 0; i < proposalsLength; i++) {
            const key = i.toString();
            const election = await ERC20VoteProcedure.loadElection(address, key, signerOrProvider).catch((error) => {
                console.warn('Error while loading election in ERC20 vote procedure.', address, key, error.message);
                return null;
            });
            if (election)
                elections.push(election);
        }
        return elections;
    }
    static async load(address, signerOrProvider, initialProcedure) {
        const procedure = await Procedure.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        const contract = new ethers.Contract(address, ERC20VoteProcedureContractABI.abi, signerOrProvider);
        const erc20 = await contract.tokenContract();
        const quorumSize = await contract.quorumSize();
        const voteDuration = await contract.voteDuration();
        const majoritySize = await contract.majoritySize();
        const elections = await ERC20VoteProcedure.loadElections(address, signerOrProvider);
        const proposals = procedure.proposals.map(proposal => {
            if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
                const election = elections.find(ba => ba.proposalKey === proposal.key);
                if (election?.start) {
                    proposal.blocked =
                        !election.approved &&
                            parseInt(election.start) + parseInt(voteDuration) <=
                                Date.now() / 1000;
                }
            }
            return proposal;
        });
        const chainId = await (signerOrProvider.provider ? signerOrProvider : signerOrProvider.provider)?.provider
            ?.getNetwork()
            .then(n => n.chainId);
        return new ERC20VoteProcedure({
            ...initialProcedure,
            cid: procedure.cid,
            address: procedure.address,
            chainId: chainId?.toString(),
            signerOrProvider,
            metadata: procedure.metadata,
            proposers: procedure.proposers,
            moderators: procedure.moderators,
            deciders: procedure.deciders,
            withModeration: procedure.withModeration,
            forwarder: procedure.forwarder,
            proposals,
            erc20: erc20?.toString(),
            quorumSize: quorumSize?.toString(),
            voteDuration: voteDuration?.toString(),
            majoritySize: majoritySize?.toString(),
            elections,
            typeName: 'erc20Vote',
            type: erc20Vote
        });
    }
    async erc20Balance(account) {
        const erc20 = await this.contract.tokenContract();
        const ERC20_ABI = [
            {
                constant: true,
                inputs: [{ name: '_owner', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ name: 'balance', type: 'uint256' }],
                type: 'function'
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ name: '', type: 'uint8' }],
                type: 'function'
            }
        ];
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const erc20Contract = new ethers.Contract(erc20, ERC20_ABI, signerOrProvider);
        if (this.signer == null && account == null) {
            return BigInt(0);
        }
        return await erc20Contract.balanceOf(account ?? (await this.signer?.getAddress()));
    }
    async vote(proposalKey, approval, options) {
        const tx = await this.contract
            .vote(proposalKey, approval)
            .catch((error) => {
            console.error('Error while voting.', this.address, proposalKey, error.message);
            return false;
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, 'Initialize ERC20 Vote procedure.');
        }
        return await tx.wait();
    }
    async count(proposalKey) {
        return this.contract.count(proposalKey).catch((error) => {
            console.error('Error while voting.', this.address, proposalKey, error.message);
            return false;
        });
    }
}
