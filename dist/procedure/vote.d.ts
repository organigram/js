import { ethers } from 'ethers';
import { Procedure, type ProcedureProposal, type Election } from '../procedure';
import { type TransactionOptions } from '../organigramClient';
export type VoteProcedureInput = {
    cid: string;
    address?: string;
    chainId: string;
    signerOrProvider: ethers.Signer | ethers.Provider;
    metadata: unknown;
    proposers: string;
    moderators?: string;
    deciders: string;
    withModeration: boolean;
    forwarder: string;
    proposals: ProcedureProposal[];
    isDeployed: boolean;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    salt?: string;
};
export declare class VoteProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    constructor({ cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, isDeployed, quorumSize, voteDuration, majoritySize, elections, salt }: VoteProcedureInput);
    static _populateInitialize(type: string, options: {
        signer: ethers.Signer;
    } & TransactionOptions, cid: string, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, quorumSize: string, voteDuration: string, majoritySize: string): Promise<ethers.ContractTransaction>;
    static loadElection(address: string, proposalKey: string, signer: ethers.Signer): Promise<Election>;
    static loadElections(address: string, signer: ethers.Signer): Promise<Election[]>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<VoteProcedure>;
    vote(proposalKey: string, approval: boolean, options?: TransactionOptions): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
}
