import ERC20VoteProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/ERC20Vote.sol/ERC20VoteProcedure.json';
import { Procedure } from '.';
import { erc20Vote } from './utils';
import { VoteProcedure } from './vote';
import { handleJsonBigInt } from '../utils';
import { encodeFunctionData, zeroAddress } from 'viem';
import { createContractWriteTransaction, getContractInstance } from '../contracts';
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
        return {
            data: encodeFunctionData({
                abi: ERC20VoteProcedureContractABI.abi,
                functionName: 'initialize',
                args: [
                    input.cid,
                    input.proposers,
                    input.moderators,
                    input.deciders,
                    input.withModeration,
                    input.forwarder,
                    Number(quorumSize),
                    Number(voteDuration),
                    Number(majoritySize),
                    erc20
                ]
            })
        };
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
        const quorumSize = (await contract.read.quorumSize());
        const voteDuration = (await contract.read.voteDuration());
        const majoritySize = (await contract.read.majoritySize());
        const elections = await ERC20VoteProcedure.loadElections(address, clients, procedure.proposals.length);
        const proposals = procedure.proposals.map(proposal => {
            if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
                const election = elections.find(candidate => candidate.proposalKey === proposal.key);
                if (election?.start) {
                    proposal.blocked =
                        !election.approved &&
                            parseInt(election.start) + Number(voteDuration) <= Date.now() / 1000;
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
            quorumSize: quorumSize.toString(),
            voteDuration: voteDuration.toString(),
            majoritySize: majoritySize.toString(),
            elections,
            data: initialProcedure?.data ??
                JSON.stringify({
                    quorumSize: quorumSize.toString(),
                    voteDuration: voteDuration.toString(),
                    majoritySize: majoritySize.toString()
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
        return (await tx.wait()).status === 'success';
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
        quorumSize: this.quorumSize,
        voteDuration: this.voteDuration,
        majoritySize: this.majoritySize,
        elections: this.elections
    }, handleJsonBigInt));
}
