import NominationProcedureContractABI from '@organigram/protocol/abi/Nomination.sol/NominationProcedure.json' with { type: 'json' };
import { encodeFunctionData, zeroAddress } from 'viem';
import { Procedure } from '.';
import { getDefaultChainId, getDeployment } from '../deployments';
import { getProcedureType } from './utils';
import { createContractWriteTransaction, getContractInstance, getWalletAccount } from '../contracts';
export class NominationProcedure extends Procedure {
    static INTERFACE = '0xc5f28e49';
    contract;
    typeName = 'nomination';
    constructor(procedureInput) {
        super({ ...procedureInput, typeName: 'nomination' });
        this.type = getProcedureType(this.chainId, 'nomination');
        this.contract =
            this.publicClient != null
                ? getContractInstance({
                    address: this.address,
                    abi: NominationProcedureContractABI.abi,
                    publicClient: this.publicClient,
                    walletClient: this.walletClient
                })
                : undefined;
    }
    static async _populateInitialize(input, _clients) {
        const deciders = input.deciders.trim();
        if (deciders === '') {
            throw new Error('Nomination procedure deciders address is required.');
        }
        const proposers = input.proposers?.trim() === '' ? deciders : input.proposers ?? deciders;
        const moderators = input.moderators?.trim() === ''
            ? zeroAddress
            : input.moderators ?? zeroAddress;
        return {
            data: encodeFunctionData({
                abi: NominationProcedureContractABI.abi,
                functionName: 'initialize',
                args: [
                    input.cid ?? 'nomination',
                    proposers,
                    moderators,
                    deciders,
                    input.withModeration ?? false,
                    input.forwarder ??
                        getDeployment(getDefaultChainId(), 'MetaGasStation')
                ]
            })
        };
    }
    static async load(address, clients, initialProcedure) {
        const procedure = await Procedure.load(address, clients, initialProcedure);
        return new NominationProcedure({
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
            proposals: procedure.proposals,
            isDeployed: true,
            salt: procedure.salt,
            typeName: 'nomination',
            data: initialProcedure?.data ?? ''
        });
    }
    async nominate(proposalKey, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: NominationProcedureContractABI.abi,
            functionName: 'nominate',
            args: [BigInt(proposalKey)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, 'Initialize Nomination procedure.');
        await tx.wait();
    }
    async reject(proposalKey, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: NominationProcedureContractABI.abi,
            functionName: 'reject',
            args: [BigInt(proposalKey)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, 'Reject Nomination procedure proposal.');
        await tx.wait();
    }
    async signNomination(input) {
        if (this.walletClient == null) {
            throw new Error('Connected wallet cannot sign typed data.');
        }
        const account = await getWalletAccount(this.walletClient);
        return await this.walletClient.signTypedData({
            account,
            domain: this.getTypedDataDomain(),
            primaryType: 'Nomination',
            types: {
                Nomination: [
                    { name: 'proposalKey', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            },
            message: {
                proposalKey: BigInt(input.proposalKey),
                nonce: input.nonce,
                deadline: BigInt(input.deadline)
            }
        });
    }
    async nominateBySig(input) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: NominationProcedureContractABI.abi,
            functionName: 'nominateBySig',
            args: [
                BigInt(input.proposalKey),
                input.nonce,
                BigInt(input.deadline),
                input.signature
            ],
            clients: this.getClients()
        });
        await tx.wait();
    }
}
