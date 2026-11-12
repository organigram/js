import { Procedure, type Election, type ProcedureInput, type ProcedureJson } from '../procedure';
import { type TransactionOptions } from '../organigramClient';
import { type PopulateInitializeInput, type PopulatedTransactionData, ProcedureTypeName } from './utils';
import { type ContractClients, type OrganigramContract } from '../contracts';
/** The data of a vote procedure. */
export type VoteProcedureInput = ProcedureInput & {
    /**
     * Share of the voters who must vote, in thousandths of a percent: `20001` is 20.001%.
     */
    quorumSize: string;
    /** Duration of the vote, in seconds. */
    voteDuration: string;
    /**
     * Share of the ballots that must approve, in thousandths of a percent: `50001` is 50.001%.
     */
    majoritySize: string;
    /** State of the vote on each proposal. */
    elections: Election[];
};
/**
 * A procedure in which the members of the deciders organ vote on each proposal.
 *
 * @remarks The vote opens when a proposal is presented. Once it is over, anyone calls `applyProposal()` to count the ballots and settle the proposal.
 */
export declare class VoteProcedure extends Procedure {
    /** ERC-165 interface identifier of vote procedures. */
    static INTERFACE: string;
    /** viem contract instance, once loaded. */
    contract?: OrganigramContract;
    /** Share of the voters who must vote, in thousandths of a percent. */
    quorumSize: string;
    /** Duration of the vote, in seconds. */
    voteDuration: string;
    /** Share of the ballots that must approve, in thousandths of a percent. */
    majoritySize: string;
    /** State of the vote on each proposal. */
    elections: Election[];
    /** Always `vote`. */
    typeName: ProcedureTypeName;
    constructor({ quorumSize, voteDuration, majoritySize, elections, ...procedureInput }: VoteProcedureInput);
    /** @internal */
    static _populateInitialize(input: PopulateInitializeInput, clients: ContractClients): Promise<PopulatedTransactionData>;
    /** Read the state of the vote on one proposal. */
    static loadElection(address: string, proposalKey: string, clients: ContractClients, voteDuration?: bigint, contract?: OrganigramContract, blockTimestamp?: bigint): Promise<Election>;
    /** Read the state of the vote on every proposal. */
    static loadElections(address: string, clients: ContractClients, proposalsLength?: number): Promise<Election[]>;
    /** Read a vote procedure from chain, with its proposals and elections. */
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<VoteProcedure>;
    /** Vote for or against a proposal, as a decider. */
    vote(proposalKey: string, choice: 'for' | 'against', options?: TransactionOptions): Promise<void>;
    /**
     * Sign a vote, for `voteBySig()`.
     *
     * @remarks The signer pays no gas: any account can submit the signature with the matching `…BySig` method.
     */
    signVote(input: {
        proposalKey: string;
        approval: boolean;
        nonce: bigint;
        deadline: bigint | number;
    }): Promise<string>;
    /** Cast a vote signed by a decider. */
    voteBySig(input: {
        proposalKey: string;
        approval: boolean;
        nonce: bigint;
        deadline: bigint | number;
        signature: string;
    }): Promise<void>;
    /** Tell whether a proposal passed, once its vote is over. */
    count(proposalKey: string): Promise<boolean>;
    /** Convert the procedure into plain JSON. */
    toJson: () => ProcedureJson;
}
