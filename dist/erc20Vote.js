"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const procedure_1 = __importDefault(require("./procedure"));
const ERC20VoteProcedure_json_1 = __importDefault(require("@organigram/protocol/abi/ERC20VoteProcedure.json"));
class ERC20VoteProcedure extends procedure_1.default {
    static INTERFACE = '0xc9d27afe';
    erc20;
    quorumSize;
    voteDuration;
    majoritySize;
    elections;
    contract;
    constructor(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, erc20, quorumSize, voteDuration, majoritySize, elections) {
        super(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals);
        this.erc20 = erc20;
        this.quorumSize = quorumSize;
        this.voteDuration = voteDuration;
        this.majoritySize = majoritySize;
        this.elections = elections;
        this.contract = new ethers_1.ethers.Contract(address, ERC20VoteProcedure_json_1.default, signerOrProvider);
    }
    static async _populateInitialize(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, erc20, quorumSize, voteDuration, majoritySize) {
        if (options.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers_1.ethers.Contract(type, ERC20VoteProcedure_json_1.default, options.signer);
        return await contract.initialize.populateTransaction(cid, proposers, moderators, deciders, withModeration, forwarder, erc20, quorumSize, voteDuration, majoritySize);
    }
    static async loadElection(address, proposalKey, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, ERC20VoteProcedure_json_1.default, signerOrProvider);
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
        const data = await procedure_1.default.loadData(address, signerOrProvider);
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
    static async load(address, signerOrProvider) {
        const procedure = await procedure_1.default.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        const contract = new ethers_1.ethers.Contract(address, ERC20VoteProcedure_json_1.default, signerOrProvider);
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
        return new ERC20VoteProcedure(procedure.cid, procedure.address, procedure.chainId, signerOrProvider, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.forwarder, proposals, erc20.toString(), quorumSize.toString(), voteDuration.toString(), majoritySize.toString(), elections);
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
        const erc20Contract = new ethers_1.ethers.Contract(erc20, ERC20_ABI, signerOrProvider);
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
        return tx.wait();
    }
    async count(proposalKey) {
        return this.contract.count(proposalKey).catch((error) => {
            console.error('Error while voting.', this.address, proposalKey, error.message);
            return false;
        });
    }
}
exports.default = ERC20VoteProcedure;
