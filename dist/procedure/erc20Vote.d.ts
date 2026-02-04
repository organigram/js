import { ethers } from 'ethers';
import { Procedure, type Election, ProcedureInput } from '.';
import { TransactionOptions } from '../organigramClient';
export type ERC20VoteProcedureInput = ProcedureInput & {
    erc20: string;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
};
export declare class ERC20VoteProcedure extends Procedure {
    static INTERFACE: string;
    erc20: string;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    contract: ethers.Contract;
    constructor({ cid, salt, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals, isDeployed, erc20, quorumSize, voteDuration, majoritySize, elections, sourceOrgans, targetOrgans }: ERC20VoteProcedureInput);
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
