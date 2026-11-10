import { type PublicClient, type WalletClient } from 'viem';
import type { TransactionOptions } from '../organigramClient';
import { type PopulateInitializeInput, type PopulatedTransactionData, type ERC20VoteRoleMode, ProcedureTypeName } from './utils';
import { type ContractClients, type OrganigramTransaction, type OrganigramTransactionReceipt, type OrganigramContract } from '../contracts';
/**
 * A parameter of a procedure type, as shown in a form, such as the vote duration.
 */
export interface ProcedureTypeField {
    /** Key of the parameter in the procedure `data`. */
    name: string;
    /** Display label. */
    label: string;
    /** Explanation shown to the user. */
    description: string;
    /** Value used when none is given. */
    defaultValue: string;
    /** Input kind. */
    type: 'string' | 'number' | 'boolean' | 'roleMode' | 'moderatorRoleMode';
}
/**
 * A procedure implementation registered on a chain, which procedures are cloned from.
 */
export interface ProcedureType {
    /** Procedure type name. */
    key: string;
    /** Address of the implementation contract. */
    address: string;
    /** Label, description and metadata reference of the type. */
    metadata: {
        cid?: string;
        label?: string;
        description?: string;
    };
    /** Parameters specific to the type, by name. */
    fields?: {
        [key: string]: ProcedureTypeField;
    };
}
type ProcedureContractData = {
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    proposalsLength: bigint;
    interfaceId?: string;
};
/** A procedure as plain JSON, to store or send it. */
export type ProcedureJson = {
    isDeployed: boolean;
    address: string;
    deciders: string;
    typeName: ProcedureTypeName;
    name: string;
    description: string;
    cid: string;
    salt?: string | null;
    chainId: string;
    data: string;
    metadata?: string;
    proposers: string;
    moderators: string;
    withModeration: boolean;
    proposerMode?: ERC20VoteRoleMode;
    moderatorMode?: ERC20VoteRoleMode;
    voterMode?: ERC20VoteRoleMode;
    requireMemberMajority?: boolean;
    forwarder: string;
    proposals?: ProcedureProposal[];
    args?: unknown[];
    type: ProcedureType;
    organigramId?: string | null;
};
/** The state of the vote on one proposal. */
export type Election = {
    /** Proposal being voted on. */
    proposalKey: string;
    /** Unix time, in seconds, when the vote opened. */
    start: string;
    /** Number of ballots cast. */
    votesCount: string;
    /** Whether the connected wallet has voted. */
    hasVoted: boolean;
    /** Votes for, weighted by tokens for an ERC-20 vote. */
    approvals?: string;
    /** Votes against, weighted by tokens for an ERC-20 vote. */
    objections?: string;
    /** Total votes that could be cast. */
    eligibleVotes?: string;
    /** Whether the proposal passed, once the vote is over. */
    approved?: boolean;
};
/** The roles an account holds in a procedure. */
export type AccountInOrgans = {
    /** Whether it may moderate proposals. */
    moderators?: boolean;
    /** Whether it may submit proposals. */
    proposers?: boolean;
    /** Whether it may decide on proposals. */
    deciders?: boolean;
};
/** Keyword describing what an operation does, used to filter and label it. */
export type OperationTag = 'cid' | 'entries' | 'permissions' | 'coins' | 'collectibles' | 'erc721' | 'erc20' | 'erc1155' | 'ether' | 'add' | 'replace' | 'remove' | 'deposit' | 'withdraw' | 'transfer';
/** Kind of a parameter of an operation, used to build its form. */
export type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'bytes' | 'addresses' | 'index' | 'indexes' | 'organ' | 'oldPermissionAddress' | 'newPermissionAddress' | 'permissionAddress' | 'permissionValue' | 'proposal' | 'proposals' | 'amount' | 'tokenId';
/** What an operation parameter is used for in a form. */
export type OperationParamAction = 'select' | 'create' | 'update' | 'delete' | 'withdraw' | 'deposit' | 'transfer' | 'block';
/** One decoded parameter of an operation, to display or edit it. */
export interface OperationParam {
    /** Kind of the parameter. */
    type: OperationParamType;
    /** What the parameter is used for. */
    action?: OperationParamAction;
    /** Decoded value. */
    value?: unknown;
    /** Function turning the form value into the call argument. */
    parser?: unknown;
}
/**
 * A function a proposal operation can call, with what a form needs to build the call.
 */
export interface ProcedureProposalOperationFunction {
    /** Four-byte function selector. */
    funcSig: string;
    /** Function name. */
    key: OperationKey;
    /** Solidity signature. */
    signature?: string;
    /** Display label. */
    label?: string;
    /** Keywords describing the function. */
    tags?: OperationTag[];
    /** Kinds of its parameters, in order. */
    params?: OperationParamType[];
    /** ABI fragment, for functions outside the organ contract. */
    abi?: unknown;
    /** Whether the call targets an organ or the procedure itself. */
    target?: 'organ' | 'self';
}
/** A call to a contract outside the organization, made by an organ. */
export interface ExternalCallOperationInput {
    /**
     * Organ making the call. It must allow this call in its execution whitelist.
     */
    organAddress: string;
    /** Contract called. */
    target: string;
    /** Encoded call. */
    data: string;
    /** Ether sent with the call, in wei. */
    value?: string | bigint | number;
    /** Position of the operation in the proposal. */
    index?: string | number;
}
/** A proposal to sign, so that another account submits it. */
export interface SignedProposalInput {
    /** Reference to the proposal metadata. */
    cid: string;
    /** Operations of the proposal. */
    operations: ProcedureProposalOperation[];
    /** Current signature nonce of the signer, from `getNonce()`. */
    nonce: bigint;
    /** Unix time, in seconds, after which the signature is refused. */
    deadline: bigint | number;
}
/** An action on a proposal to sign, so that another account submits it. */
export interface SignedProposalActionInput {
    /** Proposal the action applies to. */
    proposalKey: string;
    /** Current signature nonce of the signer, from `getNonce()`. */
    nonce: bigint;
    /** Unix time, in seconds, after which the signature is refused. */
    deadline: bigint | number;
}
/** A proposal block to sign, so that another account submits it. */
export interface SignedBlockProposalInput extends SignedProposalActionInput {
    /** Why the proposal is blocked. */
    reason: string;
}
/**
 * One call a proposal makes once adopted.
 *
 * @remarks Build it with `Procedure.createOperation()` rather than by hand.
 */
export interface ProcedureProposalOperation {
    /** Position in the proposal. */
    index: string;
    /** Four-byte selector of the function called. */
    functionSelector: string;
    /** Contract called. The zero address calls the procedure itself. */
    target?: string;
    /** Encoded call. */
    data: string;
    /** Ether sent with the call, in wei. */
    value?: string;
    /** Whether the call has run. */
    processed?: boolean;
    /** The function called, when it is a known one. */
    function?: ProcedureProposalOperationFunction;
    /** Decoded parameters, to display them. */
    params?: OperationParam[];
    /** Explanation shown to the user. */
    description?: string;
}
/** A proposal submitted to a procedure, and where it stands. */
export interface ProcedureProposal {
    /** Identifier of the proposal in its procedure. */
    key: string;
    /** Address that submitted it. */
    creator: string;
    /** Reference to its off-chain metadata. */
    cid: string;
    /** Why a moderator blocked it. */
    blockReason: string;
    /** Whether it reached the deciders, after moderation if enabled. */
    presented: boolean;
    /** Whether a moderator blocked it. */
    blocked: boolean;
    /** Whether the deciders adopted it. */
    adopted: boolean;
    /** Whether it is settled: operations run if adopted, closed if rejected. */
    applied: boolean;
    /** Calls made once adopted. */
    operations: ProcedureProposalOperation[];
    /** Hash of the transaction that submitted it. */
    transactionHash?: string;
    /** Off-chain metadata, once loaded. */
    metadata?: ProposalMetadata;
}
/** Reject malformed calls before a proposal can be persisted on-chain. */
export declare const assertValidProposalOperations: (operations: ProcedureProposalOperation[]) => void;
/**
 * The function an operation calls, as listed in `Procedure.OPERATIONS_FUNCTIONS`.
 */
export type OperationKey = 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addPermission' | 'removePermission' | 'replacePermission' | 'updateMetadata' | 'withdrawEther' | 'withdrawERC20' | 'withdrawERC721' | 'externalCall' | string;
/** What a proposal says, stored off-chain: title, description and attachments. */
export interface ProposalMetadata {
    /** Title. */
    title: string;
    /** Subtitle. */
    subtitle?: string;
    /** Description. */
    description?: string;
    /** Link to a discussion. */
    discussion?: string;
    /** Attached file name. */
    file?: string;
    /** Reference to an attached file. */
    cid?: string;
}
/** The data of a procedure, deployed or still a draft. */
export interface ProcedureInput {
    /** Contract address, or a predicted address while it is a draft. */
    address?: string | null;
    /** Organ whose members adopt or reject proposals, or a single address. */
    deciders: string;
    /** Procedure type: `nomination`, `vote` or `erc20Vote`. */
    typeName: string;
    /** Registered procedure type this procedure is a clone of. */
    type?: ProcedureType;
    /** Display name. */
    name?: string | null;
    /** Free description. */
    description?: string | null;
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Chain the procedure lives on. */
    chainId?: string | null;
    /** Reference to the off-chain metadata of the procedure. */
    cid?: string | null;
    /** Client used for reads. */
    publicClient?: PublicClient | null;
    /** Client that signs transactions. */
    walletClient?: WalletClient | null;
    /** Off-chain metadata, as a JSON string. */
    metadata?: string | null;
    /** Organ whose members may submit proposals, or a single address. */
    proposers?: string | null;
    /** Whether proposals must be presented by a moderator before the decision. */
    withModeration?: boolean | null;
    /** Whether proposers are organ members, token holders, or nobody. */
    proposerMode?: ERC20VoteRoleMode | null;
    /** Whether moderators are organ members, token holders, or nobody. */
    moderatorMode?: ERC20VoteRoleMode | null;
    /** Whether voters are organ members or token holders. */
    voterMode?: ERC20VoteRoleMode | null;
    /**
     * Whether a majority of the deciders organ must also approve, besides the token-weighted vote.
     */
    requireMemberMajority?: boolean | null;
    /**
     * Organ whose members may present or block proposals, when moderation is enabled.
     */
    moderators?: string | null;
    /** Trusted forwarder relaying gasless transactions. */
    forwarder?: string | null;
    /** Proposals submitted so far. */
    proposals?: ProcedureProposal[] | null;
    /** Whether the contract exists on chain. */
    isDeployed?: boolean | null;
    /** Organigram the procedure belongs to. */
    organigramId?: string | null;
    /**
     * Parameters specific to the procedure type, as a JSON string, such as the vote duration.
     */
    data?: string | null;
}
export declare const procedureFunctions: ProcedureProposalOperationFunction[];
/**
 * The rules by which the members of some organs may change other organs.
 *
 * @remarks A proposal is a list of operations. Proposers submit it with `propose()`. With moderation, a moderator presents it with `presentProposal()` or blocks it with `blockProposal()`. Deciders then adopt or reject it, depending on the procedure type, and adoption runs its operations.
 * Every action also has a signed variant (`sign…` then `…BySig`), so that a relayer submits it and users need no gas.
 */
export declare class Procedure {
    /** ERC-165 interface identifier of procedure contracts. */
    static INTERFACE: string;
    /**
     * Functions a proposal operation can call, with what a form needs to build them.
     */
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    /** Display name. */
    name: string;
    /** Free description. */
    description: string;
    /** Contract address, or a predicted address while it is a draft. */
    address: string;
    /** Procedure type: `nomination`, `vote` or `erc20Vote`. */
    typeName: ProcedureTypeName;
    /** Reference to the off-chain metadata of the procedure. */
    cid: string;
    /** Whether the contract exists on chain. */
    isDeployed: boolean;
    /** Organ whose members adopt or reject proposals, or a single address. */
    deciders: string;
    /** Organ whose members may submit proposals, or a single address. */
    proposers: string;
    /** Whether proposals must be presented by a moderator before the decision. */
    withModeration: boolean;
    /**
     * Organ whose members may present or block proposals, when moderation is enabled.
     */
    moderators: string;
    /** Off-chain metadata, as a JSON string. */
    metadata: string;
    /**
     * Parameters specific to the procedure type, as a JSON string, such as the vote duration.
     */
    data: string;
    /** Trusted forwarder relaying gasless transactions. */
    forwarder: string;
    /** Proposals submitted so far. */
    proposals: ProcedureProposal[];
    /** viem contract instance, once loaded. */
    contract?: OrganigramContract;
    /** Salt that determines the clone address. */
    salt?: string;
    /** Chain the procedure lives on. */
    chainId: string;
    /** Client that signs transactions. */
    walletClient?: WalletClient;
    /** Client used for reads. */
    publicClient?: PublicClient;
    /** Organigram the procedure belongs to. */
    organigramId: string;
    /** Registered procedure type this procedure is a clone of. */
    type: ProcedureType;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, publicClient, walletClient, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId, }: ProcedureInput);
    /** The viem clients of the procedure. */
    protected getClients(): ContractClients;
    /** @internal */
    static _populateInitialize(_populateInitializeInput: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    /** Read the roles, metadata reference and proposal count of a procedure. */
    static loadData(address: string, clients: ContractClients): Promise<ProcedureContractData>;
    /** Read one proposal of a procedure. */
    static loadProposal(address: string, proposalKey: string, clients: ContractClients): Promise<ProcedureProposal>;
    /** Read every proposal of a procedure. */
    static loadProposals(address: string, clients: ContractClients, data?: ProcedureContractData): Promise<ProcedureProposal[]>;
    /** Read a procedure from chain, with its proposals. */
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<Procedure>;
    /** @internal */
    static _stringifyParamType(type: OperationParamType): string;
    /** @internal */
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    /** Normalize an operation read from chain. */
    static parseOperation(rawOperation: unknown): ProcedureProposalOperation;
    /** Tell whether a contract is a procedure. */
    static isProcedure(address: string, clients: ContractClients): Promise<boolean>;
    /**
     * Submit a proposal.
     *
     * @param input - Reference to the proposal metadata, which must be a CID reference, and its operations.
     */
    propose(input: {
        cid: string;
        operations: ProcedureProposalOperation[];
        options?: TransactionOptions;
    }): Promise<ProcedureProposal>;
    /**
     * Sign a proposal, so that another account submits it with `proposeBySig()`.
     *
     * @remarks The signer pays no gas: any account can submit the signature with the matching `…BySig` method.
     */
    signProposal(input: SignedProposalInput): Promise<string>;
    /** Sign the presentation of a proposal, for `presentProposalBySig()`. */
    signPresentProposal(input: SignedProposalActionInput): Promise<string>;
    /** Sign the block of a proposal, for `blockProposalBySig()`. */
    signBlockProposal(input: SignedBlockProposalInput): Promise<string>;
    /** Sign the application of a proposal, for `applyProposalBySig()`. */
    signApplyProposal(input: SignedProposalActionInput): Promise<string>;
    /** Submit a proposal signed by another account. */
    proposeBySig(input: SignedProposalInput & {
        signature: string;
    }): Promise<OrganigramTransaction>;
    /** Read the next signature nonce of an account. */
    getNonce(account: string): Promise<bigint>;
    /** EIP-712 domain of the signatures of this procedure. */
    getTypedDataDomain(): {
        name: string;
        version: string;
        chainId: bigint;
        verifyingContract: `0x${string}`;
    };
    /**
     * Turn a contract call, such as the result of `Organ.populateTransaction()`,
     * into a proposal operation.
     */
    static createOperation({ to, data, value, index }: {
        to: string;
        data: string;
        value?: number | string | bigint;
        index?: number | string;
    }): ProcedureProposalOperation;
    /**
     * Build an operation that makes an organ call a contract outside the organization.
     */
    static createExternalCallOperation({ organAddress, target, data, value, index }: ExternalCallOperationInput): ProcedureProposalOperation;
    /** Block a proposal as a moderator, before its decision. */
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /** Block a proposal signed by a moderator. */
    blockProposalBySig(input: SignedBlockProposalInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /** Present a proposal to the deciders, as a moderator. */
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /** Present a proposal signed by a moderator. */
    presentProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /**
     * Settle a proposal: for a vote, count the ballots once it is over, then run or close it.
     */
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /** Settle a proposal, with an application signed by another account. */
    applyProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    /** Read every proposal again from chain. */
    reloadProposals(): Promise<Procedure>;
    /** Read one proposal again from chain. */
    reloadProposal(proposalKey: string): Promise<Procedure>;
    /** Read the roles and metadata reference again from chain. */
    reloadData(): Promise<Procedure>;
    /** Convert the procedure into plain JSON. */
    toJson: () => ProcedureJson;
}
export {};
