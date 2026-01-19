"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const procedure_1 = __importDefault(require("../procedure"));
const VoteProcedure_json_1 = __importDefault(require("@organigram/protocol/abi/VoteProcedure.json"));
class VoteProcedure extends procedure_1.default {
    static INTERFACE = '0xc9d27afe';
    contract;
    quorumSize;
    voteDuration;
    majoritySize;
    elections;
    constructor(cid, address, chainId, signer, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, quorumSize, voteDuration, majoritySize, elections) {
        super(cid, address, chainId, signer, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals);
        this.quorumSize = quorumSize;
        this.voteDuration = voteDuration;
        this.majoritySize = majoritySize;
        this.elections = elections;
        this.contract = new ethers_1.ethers.Contract(address, VoteProcedure_json_1.default, signer);
    }
    static async _populateInitialize(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, quorumSize, voteDuration, majoritySize) {
        if (options.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers_1.ethers.Contract(type, VoteProcedure_json_1.default, options.signer);
        return await contract.initialize.populateTransaction(cid, proposers, moderators, deciders, withModeration, forwarder, quorumSize, voteDuration, majoritySize);
    }
    static async loadElection(address, proposalKey, signer) {
        const contract = new ethers_1.ethers.Contract(address, VoteProcedure_json_1.default, signer);
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
        const data = await procedure_1.default.loadData(address, signer);
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
    static async load(address, signer) {
        const procedure = await procedure_1.default.load(address, signer);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        const contract = new ethers_1.ethers.Contract(address, VoteProcedure_json_1.default, signer);
        const quorumSize = await contract.quorumSize();
        const voteDuration = await contract.voteDuration();
        const majoritySize = await contract.majoritySize();
        const elections = await VoteProcedure.loadElections(address, signer);
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
        return new VoteProcedure(procedure.cid, procedure.address, procedure.chainId, signer, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.forwarder, proposals, quorumSize.toString(), voteDuration.toString(), majoritySize.toString(), elections);
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
        return tx.wait();
    }
    async count(proposalKey) {
        return this.contract.count(proposalKey).catch((error) => {
            console.error('Error while counting.', this.address, proposalKey, error.message);
            return false;
        });
    }
}
exports.default = VoteProcedure;
