import { ethers } from 'ethers';
import { Procedure, ProcedureInput } from '.';
import { TransactionOptions } from '../organigramClient';
export declare class NominationProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    constructor({ cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, isDeployed, salt, contract, sourceOrgans, targetOrgans }: ProcedureInput & {
        contract?: ethers.Contract;
    });
    static _populateInitialize(type: string, options: {
        signer: ethers.Signer;
    } & TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, _withModeration: Boolean, forwarder: string, ..._args: any[]): Promise<ethers.ContractTransaction>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<NominationProcedure>;
    nominate(proposalKey: string, options?: TransactionOptions): Promise<boolean>;
}
