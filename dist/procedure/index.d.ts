import { type ContractTransactionReceipt, ethers } from 'ethers';
import type { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, ProcedureTypeName } from './utils';
export interface ProcedureTypeField {
    name: string;
    label: string;
    description: string;
    defaultValue: string;
    type: any;
}
export interface ProcedureType {
    key: string;
    address: string;
    metadata: {
        cid?: string;
        label?: string;
        description?: string;
    };
    fields?: {
        [key: string]: ProcedureTypeField;
    };
}
export type ProcedureJson = {
    isDeployed: boolean;
    address: string;
    deciders: string;
    typeName: string;
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
    forwarder: string;
    proposals?: ProcedureProposal[];
    args?: unknown[];
    type: ProcedureType;
    organigramId?: string | null;
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
export type OperationTag = 'cid' | 'entries' | 'permissions' | 'coins' | 'collectibles' | 'erc721' | 'erc20' | 'erc1155' | 'ether' | 'add' | 'replace' | 'remove' | 'deposit' | 'withdraw' | 'transfer';
export type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'addresses' | 'index' | 'indexes' | 'organ' | 'oldPermissionAddress' | 'newPermissionAddress' | 'permissionAddress' | 'permissionValue' | 'proposal' | 'proposals' | 'amount' | 'tokenId';
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
export type ProposalKey = 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addPermission' | 'removePermission' | 'replacePermission' | 'updateMetadata' | 'transfer' | string;
export interface ProposalMetadata {
    title: string;
    subtitle?: string;
    description?: string;
    discussion?: string;
    file?: string;
    cid?: string;
}
export interface ProcedureInput {
    address?: string | null;
    deciders: string;
    typeName: string;
    type?: ProcedureType;
    name?: string | null;
    description?: string | null;
    salt?: string | null;
    chainId?: string | null;
    cid?: string | null;
    signerOrProvider?: ethers.Signer | ethers.Provider | null;
    metadata?: string | null;
    proposers?: string | null;
    withModeration?: boolean | null;
    moderators?: string | null;
    forwarder?: string | null;
    proposals?: ProcedureProposal[] | null;
    isDeployed?: boolean | null;
    organigramId?: string | null;
    data?: string | null;
}
export declare const procedureFunctions: ProcedureProposalOperationFunction[];
export declare class Procedure {
    static INTERFACE: string;
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    name: string;
    description: string;
    address: string;
    typeName: ProcedureTypeName;
    cid: string;
    isDeployed: boolean;
    deciders: string;
    proposers: string;
    withModeration: boolean;
    moderators: string;
    metadata: string;
    data: string;
    forwarder: string;
    proposals: ProcedureProposal[];
    _contract: ethers.Contract;
    salt?: string;
    chainId: string;
    signer?: ethers.Signer;
    provider?: ethers.Provider;
    organigramId: string;
    type: ProcedureType;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, signerOrProvider, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId }: ProcedureInput);
    static _populateInitialize(_populateInitializeInput: PopulateInitializeInput): Promise<ethers.ContractTransaction>;
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
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider, initialProcedure?: ProcedureInput): Promise<Procedure>;
    static _stringifyParamType(type: OperationParamType): string;
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    static parseOperation(_operation: unknown): ProcedureProposalOperation;
    static isProcedure(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<boolean>;
    updateCid(cid: string, options?: TransactionOptions): Promise<ethers.Transaction>;
    updateAdmin(address: string, options?: TransactionOptions): Promise<ethers.Transaction>;
    propose(input: {
        cid: string;
        operations: ProcedureProposalOperation[];
        options?: TransactionOptions;
    }): Promise<ProcedureProposal>;
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    adoptProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransactionReceipt>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
    toJson: () => ProcedureJson;
}
