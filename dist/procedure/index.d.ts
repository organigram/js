import { type ContractTransaction, ethers } from 'ethers';
import type { TransactionOptions } from '../organigramClient';
export type Election = {
    proposalKey: string;
    start: string;
    votesCount: string;
    hasVoted: boolean;
    approved?: boolean;
};
export type OperationTag = 'cid' | 'entries' | 'procedures' | 'coins' | 'collectibles' | 'erc721' | 'erc20' | 'erc1155' | 'ether' | 'add' | 'replace' | 'remove' | 'deposit' | 'withdraw' | 'transfer';
export type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'addresses' | 'index' | 'indexes' | 'organ' | 'procedure' | 'permissions' | 'proposal' | 'proposals' | 'amount' | 'tokenId';
export type OperationParamAction = 'select' | 'create' | 'update' | 'delete' | 'withdraw' | 'deposit' | 'transfer' | 'block';
export interface OperationParam {
    type: string;
    action?: OperationParamAction;
    value?: unknown;
    parser?: unknown;
}
export interface ProcedureProposalOperationFunction {
    funcSig: string;
    key: string;
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
    key: string;
    creator: string;
    cid: string;
    blockReason: string;
    presented: boolean;
    blocked: boolean;
    adopted: boolean;
    applied: boolean;
    operations: ProcedureProposalOperation[];
}
export declare class Procedure {
    static INTERFACE: string;
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    cid: string;
    address: string;
    chainId: string;
    metadata: unknown;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    forwarder: string;
    proposals: ProcedureProposal[];
    signer?: ethers.Signer;
    provider?: ethers.Provider;
    _contract: ethers.Contract;
    constructor(cid: string, address: string, chainId: string, signerOrProvider: ethers.Signer | ethers.Provider, metadata: unknown, proposers: string, moderators: string, deciders: string, withModeration: boolean, forwarder: string, proposals: ProcedureProposal[]);
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
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<ContractTransaction>;
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransaction>;
    adoptProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransaction>;
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<ContractTransaction>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
}
