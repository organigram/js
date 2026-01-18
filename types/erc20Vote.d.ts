import { ethers } from 'ethers';
import Procedure, { type ProcedureProposal } from './procedure';
import { Election, TransactionOptions } from './types';
export default class ERC20VoteProcedure extends Procedure {
    static INTERFACE: string;
    erc20: string;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    contract: ethers.Contract;
    constructor(cid: string, address: string, chainId: string, signerOrProvider: ethers.Signer | ethers.Provider, metadata: unknown, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, proposals: ProcedureProposal[], erc20: string, quorumSize: string, voteDuration: string, majoritySize: string, elections: Election[]);
    static _populateInitialize(type: string, options: {
        signer: ethers.Signer;
    } & TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, erc20: string, quorumSize: string, voteDuration: string, majoritySize: string): Promise<ethers.ContractTransaction>;
    static loadElection(address: string, proposalKey: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Election>;
    static loadElections(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Election[]>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<ERC20VoteProcedure>;
    erc20Balance(account?: string): Promise<bigint>;
    vote(proposalKey: string, approval: boolean, options: TransactionOptions): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
}
