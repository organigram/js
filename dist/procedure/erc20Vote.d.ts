import { ProcedureInput, ProcedureJson } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, PopulatedTransactionData, ProcedureTypeName, type ERC20VoteRoleMode } from './utils';
import { VoteProcedure, VoteProcedureInput } from './vote';
import { type ContractClients } from '../contracts';
export type ERC20VoteProcedureInput = Omit<VoteProcedureInput, 'type' | 'typeName'> & {
    erc20: string;
    proposerMode?: ERC20VoteRoleMode;
    moderatorMode?: ERC20VoteRoleMode;
    voterMode?: ERC20VoteRoleMode;
    requireMemberMajority?: boolean;
};
export declare class ERC20VoteProcedure extends VoteProcedure {
    static INTERFACE: string;
    erc20: string;
    proposerMode: ERC20VoteRoleMode;
    moderatorMode: ERC20VoteRoleMode;
    voterMode: ERC20VoteRoleMode;
    requireMemberMajority: boolean;
    contract?: any;
    typeName: ProcedureTypeName;
    constructor({ erc20, proposerMode, moderatorMode, voterMode, requireMemberMajority, ...voteProcedureArguments }: ERC20VoteProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<ERC20VoteProcedure>;
    erc20Balance(account?: string): Promise<bigint>;
    vote(proposalKey: string, approval: boolean, options: TransactionOptions): Promise<boolean>;
    toJson: () => ProcedureJson;
}
