import { ethers } from 'ethers';
import { Procedure } from '../procedure';
import VoteProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Vote.sol/VoteProcedure.json';
import { predictContractAddress } from '../utils';
export class VoteProcedure extends Procedure {
    static INTERFACE = '0xc9d27afe';
    contract;
    quorumSize;
    voteDuration;
    majoritySize;
    elections;
    constructor({ cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, isDeployed, quorumSize, voteDuration, majoritySize, elections, salt }) {
        super({
            cid,
            address,
            chainId,
            signerOrProvider,
            metadata,
            proposers,
            moderators,
            deciders,
            withModeration,
            forwarder,
            proposals,
            isDeployed,
            salt
        });
        this.address =
            address ??
                predictContractAddress({
                    type: 'VoteProcedure',
                    chainId,
                    salt: this.salt
                });
        this.quorumSize = quorumSize;
        this.voteDuration = voteDuration;
        this.majoritySize = majoritySize;
        this.elections = elections;
        this.contract = new ethers.Contract(this.address, VoteProcedureContractABI.abi, signerOrProvider);
    }
    static async _populateInitialize(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, quorumSize, voteDuration, majoritySize) {
        if (options.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers.Contract(type, VoteProcedureContractABI.abi, options.signer);
        return await contract.initialize.populateTransaction(cid, proposers, moderators, deciders, withModeration, forwarder, quorumSize, voteDuration, majoritySize);
    }
    static async loadElection(address, proposalKey, signer) {
        const contract = new ethers.Contract(address, VoteProcedureContractABI.abi, signer);
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
    static async loadElections(address, signer) {
        const data = await Procedure.loadData(address, signer);
        const proposalsLength = BigInt(data.proposalsLength);
        const elections = [];
        for (let i = 0; i < proposalsLength; i++) {
            const key = i.toString();
            const election = await VoteProcedure.loadElection(address, key, signer).catch((error) => {
                console.warn('Error while loading election in vote procedure.', address, key, error.message);
                return null;
            });
            if (election)
                elections.push(election);
        }
        return elections;
    }
    static async load(address, signerOrProvider) {
        const procedure = await Procedure.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        const contract = new ethers.Contract(address, VoteProcedureContractABI.abi, signerOrProvider);
        const quorumSize = await contract.quorumSize();
        const voteDuration = await contract.voteDuration();
        const majoritySize = await contract.majoritySize();
        const elections = await VoteProcedure.loadElections(address, signerOrProvider);
        const proposals = procedure.proposals.map((proposal) => {
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
        const chainId = (await signerOrProvider.provider?.getNetwork().then(n => n.chainId)) ??
            (await signerOrProvider
                .getNetwork()
                .then(n => n.chainId));
        return new VoteProcedure({
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
            isDeployed: true,
            quorumSize: quorumSize.toString(),
            voteDuration: voteDuration.toString(),
            majoritySize: majoritySize.toString(),
            elections
        });
    }
    async vote(proposalKey, approval, options) {
        const tx = await this.contract
            .vote(proposalKey, approval)
            .catch((error) => {
            console.error('Error while voting.', this.address, proposalKey, error.message);
            return false;
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, 'Initialize Nomination procedure.');
        }
        return await tx.wait();
    }
    async count(proposalKey) {
        return this.contract.count(proposalKey).catch((error) => {
            console.error('Error while counting.', this.address, proposalKey, error.message);
            return false;
        });
    }
}
