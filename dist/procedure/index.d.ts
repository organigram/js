import { type PublicClient, type WalletClient } from 'viem';
import type { TransactionOptions } from '../organigramClient';
import { type PopulateInitializeInput, type PopulatedTransactionData, ProcedureTypeName } from './utils';
import { type ContractClients, type OrganigramTransaction, type OrganigramTransactionReceipt } from '../contracts';
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
type ProcedureContractData = {
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    proposalsLength: bigint;
    interfaceId?: string;
};
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
export type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'bytes' | 'addresses' | 'index' | 'indexes' | 'organ' | 'oldPermissionAddress' | 'newPermissionAddress' | 'permissionAddress' | 'permissionValue' | 'proposal' | 'proposals' | 'amount' | 'tokenId';
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
export interface ExternalCallOperationInput {
    organAddress: string;
    target: string;
    data: string;
    value?: string | bigint | number;
    index?: string | number;
}
export interface SignedProposalInput {
    cid: string;
    operations: ProcedureProposalOperation[];
    nonce: bigint;
    deadline: bigint | number;
}
export interface SignedProposalActionInput {
    proposalKey: string;
    nonce: bigint;
    deadline: bigint | number;
}
export interface SignedBlockProposalInput extends SignedProposalActionInput {
    reason: string;
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
export type ProposalKey = 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addPermission' | 'removePermission' | 'replacePermission' | 'updateMetadata' | 'transfer' | 'externalCall' | string;
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
    publicClient?: PublicClient | null;
    walletClient?: WalletClient | null;
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
    contract?: any;
    salt?: string;
    chainId: string;
    walletClient?: WalletClient;
    publicClient?: PublicClient;
    organigramId: string;
    type: ProcedureType;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, publicClient, walletClient, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId }: ProcedureInput);
    protected getClients(): ContractClients;
    static _populateInitialize(_populateInitializeInput: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    static loadData(address: string, clients: ContractClients): Promise<ProcedureContractData>;
    static loadProposal(address: string, proposalKey: string, clients: ContractClients): Promise<ProcedureProposal>;
    static loadProposals(address: string, clients: ContractClients, data?: ProcedureContractData): Promise<ProcedureProposal[]>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<Procedure>;
    static _stringifyParamType(type: OperationParamType): string;
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    static parseOperation(rawOperation: unknown): ProcedureProposalOperation;
    static isProcedure(address: string, clients: ContractClients): Promise<boolean>;
    updateCid(cid: string, options?: TransactionOptions): Promise<OrganigramTransaction>;
    updateAdmin(address: string, options?: TransactionOptions): Promise<OrganigramTransaction>;
    propose(input: {
        cid: string;
        operations: ProcedureProposalOperation[];
        options?: TransactionOptions;
    }): Promise<ProcedureProposal>;
    signProposal(input: SignedProposalInput): Promise<string>;
    signPresentProposal(input: SignedProposalActionInput): Promise<string>;
    signBlockProposal(input: SignedBlockProposalInput): Promise<string>;
    signApplyProposal(input: SignedProposalActionInput): Promise<string>;
    proposeBySig(input: SignedProposalInput & {
        signature: string;
    }): Promise<OrganigramTransaction>;
    getNonce(account: string): Promise<bigint>;
    getTypedDataDomain(): {
        name: string;
        version: string;
        chainId: bigint;
        verifyingContract: `0x${string}`;
    };
    static createExternalCallOperation({ organAddress, target, data, value, index }: ExternalCallOperationInput): ProcedureProposalOperation;
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    blockProposalBySig(input: SignedBlockProposalInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    presentProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    applyProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
    toJson: () => ProcedureJson;
}
export {};
