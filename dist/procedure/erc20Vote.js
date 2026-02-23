import { ethers } from 'ethers';
import { Procedure } from '.';
import ERC20VoteProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/ERC20Vote.sol/ERC20VoteProcedure.json';
import { erc20Vote } from './utils';
import { VoteProcedure } from './vote';
import { handleJsonBigInt } from '../utils';
export class ERC20VoteProcedure extends VoteProcedure {
    static INTERFACE = '0xc9d27afe';
    erc20;
    contract;
    type = erc20Vote;
    typeName = 'erc20Vote';
    constructor({ erc20, ...voteProcedureArguments }) {
        super({
            ...voteProcedureArguments,
            typeName: 'erc20Vote',
            type: erc20Vote
        });
        this.erc20 = erc20;
        this.contract = new ethers.Contract(this.address, ERC20VoteProcedureContractABI.abi, voteProcedureArguments.signerOrProvider);
    }
    static async _populateInitialize(input) {
        if (input.options?.signer == null) {
            throw new Error('Not connected.');
        }
        const [erc20, quorumSize, voteDuration, majoritySize] = input.args;
        const contract = new ethers.Contract(erc20Vote.address, ERC20VoteProcedureContractABI.abi, input.options.signer);
        return await contract.initialize.populateTransaction(input.cid, input.proposers, input.moderators, input.deciders, input.withModeration, input.forwarder, erc20, quorumSize, voteDuration, majoritySize);
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
        const chainId = await signerOrProvider?.provider
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
            isDeployed: true,
            erc20: erc20?.toString(),
            quorumSize: quorumSize?.toString(),
            voteDuration: voteDuration?.toString(),
            majoritySize: majoritySize?.toString(),
            elections
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
        moderators: this.moderators ?? ethers.ZeroAddress,
        withModeration: this.withModeration,
        forwarder: this.forwarder,
        metadata: this.metadata,
        proposals: this.proposals,
        type: this.type,
        erc20: this.erc20,
        quorumSize: this.quorumSize,
        voteDuration: this.voteDuration,
        majoritySize: this.majoritySize,
        elections: this.elections
    }, handleJsonBigInt));
}
