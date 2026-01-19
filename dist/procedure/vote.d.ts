import { ethers } from 'ethers';
import { Procedure, type ProcedureProposal, type Election } from '../procedure';
import { type TransactionOptions } from '../organigramClient';
export declare class VoteProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    constructor(cid: string, address: string, chainId: string, signer: ethers.Signer, metadata: unknown, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, proposals: ProcedureProposal[], quorumSize: string, voteDuration: string, majoritySize: string, elections: Election[]);
    static _populateInitialize(type: string, options: {
        signer: ethers.Signer;
    } & TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, quorumSize: string, voteDuration: string, majoritySize: string): Promise<ethers.ContractTransaction>;
    static loadElection(address: string, proposalKey: string, signer: ethers.Signer): Promise<Election>;
    static loadElections(address: string, signer: ethers.Signer): Promise<Election[]>;
    static load(address: string, signer: ethers.Signer): Promise<VoteProcedure>;
    vote(proposalKey: string, approval: boolean, options?: TransactionOptions): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
}
