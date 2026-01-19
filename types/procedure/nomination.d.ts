import { ethers } from 'ethers';
import type { ProcedureProposal } from '.';
import Procedure from '.';
import { TransactionOptions } from '../types';
export default class NominationProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    constructor(cid: string, address: string, chainId: string, signerOrProvider: ethers.Signer | ethers.Provider, metadata: unknown, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, proposals: ProcedureProposal[]);
    static _populateInitialize(type: string, options: {
        signer: ethers.Signer;
    } & TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, _withModeration: Boolean, forwarder: string, ..._args: any[]): Promise<ethers.ContractTransaction>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<NominationProcedure>;
    nominate(proposalKey: string, options?: TransactionOptions): Promise<boolean>;
}
