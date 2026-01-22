import { ethers } from 'ethers';
import NominationProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Nomination.sol/NominationProcedure.json';
import { Procedure } from '.';
export class NominationProcedure extends Procedure {
    static INTERFACE = '0xc5f28e49';
    contract;
    constructor(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals) {
        super(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals);
        this.contract = new ethers.Contract(address, NominationProcedureContractABI.abi, signerOrProvider);
    }
    static async _populateInitialize(type, options, cid, proposers, moderators, deciders, _withModeration, forwarder, ..._args) {
        if (options.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers.Contract(type, NominationProcedureContractABI.abi, options.signer);
        return await contract.initialize.populateTransaction(cid, proposers, moderators, deciders, false, forwarder);
    }
    static async load(address, signerOrProvider) {
        const procedure = await Procedure.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        return new NominationProcedure(procedure.cid, procedure.address, procedure.chainId, signerOrProvider, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.forwarder, procedure.proposals);
    }
    async nominate(proposalKey, options) {
        const tx = await this.contract.nominate(proposalKey, {
            gasLimit: '1000000'
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, 'Initialize Nomination procedure.');
        }
        const receipt = await tx.wait();
        return receipt.status === 1;
    }
}
