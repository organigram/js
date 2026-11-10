import { ProcedureInput, ProcedureJson } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, PopulatedTransactionData, ProcedureTypeName, type ERC20VoteRoleMode } from './utils';
import { VoteProcedure, VoteProcedureInput } from './vote';
import { type ContractClients, type OrganigramContract } from '../contracts';
/** The data of an ERC-20 vote procedure. */
export type ERC20VoteProcedureInput = Omit<VoteProcedureInput, 'type' | 'typeName'> & {
    /** Token whose balances weigh the votes. */
    erc20: string;
    /** Whether proposers are organ members, token holders, or nobody. */
    proposerMode?: ERC20VoteRoleMode;
    /** Whether moderators are organ members, token holders, or nobody. */
    moderatorMode?: ERC20VoteRoleMode;
    /** Whether voters are organ members or token holders. */
    voterMode?: ERC20VoteRoleMode;
    /**
     * Whether a majority of the deciders organ must also approve, besides the token-weighted vote.
     */
    requireMemberMajority?: boolean;
};
/**
 * A vote procedure in which each ballot weighs the token balance of the voter.
 *
 * @remarks Ballots weigh the balances held just before the vote opened, so tokens moved during the vote do not count twice.
 */
export declare class ERC20VoteProcedure extends VoteProcedure {
    /** ERC-165 interface identifier of ERC-20 vote procedures. */
    static INTERFACE: string;
    /** Token whose balances weigh the votes. */
    erc20: string;
    /** Whether proposers are organ members, token holders, or nobody. */
    proposerMode: ERC20VoteRoleMode;
    /** Whether moderators are organ members, token holders, or nobody. */
    moderatorMode: ERC20VoteRoleMode;
    /** Whether voters are organ members or token holders. */
    voterMode: ERC20VoteRoleMode;
    /**
     * Whether a majority of the deciders organ must also approve, besides the token-weighted vote.
     */
    requireMemberMajority: boolean;
    /** viem contract instance, once loaded. */
    contract?: OrganigramContract;
    /** Always `erc20Vote`. */
    typeName: ProcedureTypeName;
    constructor({ erc20, proposerMode, moderatorMode, voterMode, requireMemberMajority, ...voteProcedureArguments }: ERC20VoteProcedureInput);
    /** @internal */
    static _populateInitialize(input: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    /**
     * Read an ERC-20 vote procedure from chain, with its proposals and elections.
     */
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<ERC20VoteProcedure>;
    /** Read the token balance of an account, or of the connected wallet. */
    erc20Balance(account?: string): Promise<bigint>;
    /** Vote for or against a proposal, with the weight of your tokens. */
    vote(proposalKey: string, choice: 'for' | 'against', options?: TransactionOptions): Promise<void>;
    /** Convert the procedure into plain JSON. */
    toJson: () => ProcedureJson;
}
