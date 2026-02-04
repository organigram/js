import { type ContractTransactionReceipt, ethers } from 'ethers';
import type { TransactionOptions } from '../organigramClient';
import { SourceOrgan, TargetOrgan } from '../organigram';
export type ProcedureJson = {
    address: string;
    deciders: string;
    typeName: string;
    name?: string;
    description?: string;
    cid?: string;
    salt?: string;
    chainId?: string;
    metadata?: unknown;
    proposers?: string;
    moderators?: string;
    withModeration?: boolean;
    forwarder?: string;
    proposals?: ProcedureProposal[];
    args?: unknown[];
};
export type Election = {
    proposalKey: string;
    start: string;
    votesCount: string;
    hasVoted: boolean;
    approved?: boolean;
};
export type AccountInOrgans = {
    moderators?: boolean;
    proposers?: boolean;
    deciders?: boolean;
};
export type OperationTag = 'cid' | 'entries' | 'procedures' | 'coins' | 'collectibles' | 'erc721' | 'erc20' | 'erc1155' | 'ether' | 'add' | 'replace' | 'remove' | 'deposit' | 'withdraw' | 'transfer';
export type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'addresses' | 'index' | 'indexes' | 'organ' | 'procedure' | 'permissions' | 'proposal' | 'proposals' | 'amount' | 'tokenId';
export type OperationParamAction = 'select' | 'create' | 'update' | 'delete' | 'withdraw' | 'deposit' | 'transfer' | 'block';
export interface OperationParam {
    type: OperationParamType;
    action?: OperationParamAction;
    value?: unknown;
    parser?: unknown;
}
export interface ProcedureProposalOperationFunction {
    funcSig: string;
    key: ProposalKey;
    signature?: string;
    label?: string;
    tags?: OperationTag[];
    params?: OperationParamType[];
    abi?: unknown;
    target?: 'organ' | 'self';
}
export interface ProcedureProposalOperation {
    index: string;
    functionSelector: string;
    target?: string;
    data: string;
    value?: string;
    processed?: boolean;
    function?: ProcedureProposalOperationFunction;
    params?: OperationParam[];
    userIsInOrgan?: boolean;
    userIsInEntry?: boolean;
    description?: string;
}
export interface ProcedureProposal {
    key: ProposalKey;
    creator: string;
    cid: string;
    blockReason: string;
    presented: boolean;
    blocked: boolean;
    adopted: boolean;
    applied: boolean;
    operations: ProcedureProposalOperation[];
    metadata?: ProposalMetadata;
}
export type ProposalKey = 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addProcedure' | 'removeProcedure' | 'replaceProcedure' | 'updateMetadata' | 'transfer' | string;
export interface ProposalMetadata {
    title: string;
    subtitle?: string;
    description?: string;
    discussion?: string;
    file?: string;
    cid?: string;
}
export interface ProcedureInput {
    address?: string;
    deciders: string;
    typeName?: string;
    name?: string;
    description?: string;
    salt?: string;
    chainId?: string;
    cid?: string;
    signerOrProvider?: ethers.Signer | ethers.Provider;
    metadata?: unknown;
    proposers?: string;
    withModeration?: boolean;
    moderators?: string;
    forwarder?: string;
    proposals?: ProcedureProposal[];
    isDeployed?: boolean;
    sourceOrgans?: SourceOrgan[];
    targetOrgans?: TargetOrgan[];
}
export declare class Procedure {
    static INTERFACE: string;
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    name: string;
    description: string;
    address: string;
    typeName: string;
    cid: string;
    isDeployed: boolean;
    deciders: string;
    proposers: string;
    withModeration: boolean;
    moderators?: string;
    metadata: unknown;
    forwarder: string;
    proposals: ProcedureProposal[];
    _contract: ethers.Contract;
    salt?: string;
    chainId?: string;
    signer?: ethers.Signer;
    provider?: ethers.Provider;
    sourceOrgans?: SourceOrgan[];
    targetOrgans?: TargetOrgan[];
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, signerOrProvider, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, sourceOrgans, targetOrgans }: ProcedureInput);
    static _populateInitialize(_address: string, _options: {
        signer: ethers.Signer;
    } & TransactionOptions, _metadata: string, _proposers: string, _moderators: string, _deciders: string, _withModeration: boolean, _forwarder: string, ..._args: unknown[]): Promise<ethers.ContractTransaction>;
    static loadData(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<{
        cid: string;
        metadata?: string;
        proposers: string;
        moderators: string;
        deciders: string;
        withModeration: boolean;
        forwarder: string;
        proposalsLength: string;
    }>;
    static loadProposal(address: string, proposalKey: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<ProcedureProposal>;
    static loadProposals(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<ProcedureProposal[]>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Procedure>;
    static _stringifyParamType(type: OperationParamType): string;
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    static parseOperation(_operation: unknown): ProcedureProposalOperation;
    static isProcedure(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<boolean>;
    updateCid(cid: string, options?: TransactionOptions): Promise<ethers.Transaction>;
    updateAdmin(address: string, options?: TransactionOptions): Promise<ethers.Transaction>;
    propose(cid: string, operations: ProcedureProposalOperation[], options?: TransactionOptions): Promise<ProcedureProposal>;
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    adoptProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
}
