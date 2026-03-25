import NominationProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Nomination.sol/NominationProcedure.json';
import { encodeFunctionData, zeroAddress } from 'viem';
import { Procedure } from '.';
import { deployedAddresses } from '../utils';
import { nomination } from './utils';
import { createContractWriteTransaction, getContractInstance, getWalletAccount } from '../contracts';
export class NominationProcedure extends Procedure {
    static INTERFACE = '0xc5f28e49';
    contract;
    type = nomination;
    typeName = 'nomination';
    constructor(procedureInput) {
        super({ ...procedureInput, typeName: 'nomination', type: nomination });
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
        return {
            data: encodeFunctionData({
                abi: NominationProcedureContractABI.abi,
                functionName: 'initialize',
                args: [
                    input.cid ?? 'nomination',
                    input.proposers ?? input.deciders ?? zeroAddress,
                    input.moderators ?? zeroAddress,
                    input.deciders,
                    input.withModeration ?? false,
                    input.forwarder ?? deployedAddresses[11155111].MetaGasStation
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
            type: nomination,
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
        const receipt = await tx.wait();
        return receipt.status === 'success';
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
        const receipt = await tx.wait();
        return receipt.status === 'success';
    }
}
