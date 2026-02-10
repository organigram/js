import { ethers } from 'ethers';
import NominationProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Nomination.sol/NominationProcedure.json';
import { Procedure } from '.';
import { deployedAddresses } from '../utils';
export const nomination = {
    key: 'nomination',
    address: deployedAddresses[11155111].NominationProcedure,
    metadata: {
        label: 'Nomination',
        description: 'A nomination allows any user in the source organ to directly add, remove or replace one or many entries, assets or procedures in the target organ.'
    }
};
export class NominationProcedure extends Procedure {
    static INTERFACE = '0xc5f28e49';
    contract;
    type = nomination;
    typeName = 'nomination';
    constructor(procedureInput) {
        super({ ...procedureInput, typeName: 'nomination', type: nomination });
        this.contract =
            procedureInput.contract ??
                new ethers.Contract(this.address, NominationProcedureContractABI.abi, procedureInput.signerOrProvider);
    }
    static async _populateInitialize(input) {
        if (input.options?.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers.Contract(nomination.address, NominationProcedureContractABI.abi, input.options.signer);
        return await contract.initialize.populateTransaction(input.cid ?? 'nomination', input.proposers ?? input.deciders ?? ethers.ZeroAddress, input.moderators ?? ethers.ZeroAddress, input.deciders, input.withModeration ?? false, input.forwarder ?? deployedAddresses[11155111].MetaGasStation);
    }
    static async load(address, signerOrProvider) {
        const procedure = await Procedure.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        const chainId = (await signerOrProvider.provider?.getNetwork().then(n => n.chainId)) ??
            (await signerOrProvider
                .getNetwork()
                .then(n => n.chainId));
        const contract = new ethers.Contract(address, NominationProcedureContractABI.abi, signerOrProvider);
        return new NominationProcedure({
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
            proposals: procedure.proposals,
            isDeployed: true,
            salt: procedure.salt,
            contract,
            typeName: 'nomination'
        });
    }
    async nominate(proposalKey, options) {
        const tx = await this.contract.nominate(proposalKey);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, 'Initialize Nomination procedure.');
        }
        const receipt = await tx.wait();
        return receipt.status === 1;
    }
}
