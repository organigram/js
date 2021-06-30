import { CID } from './ipfs';
import type { Address } from './types';
export declare type OperationTag = "metadata" | "entries" | "procedures" | "coins" | "collectibles" | "funds" | "add" | "replace" | "remove" | "deposit" | "withdraw" | "transfer";
export declare type OperationParamType = "metadata" | "entry" | "entries" | "address" | "addresses" | "index" | "indexes" | "organ" | "procedure" | "permissions" | "proposal" | "proposals";
export declare type OperationParamAction = "select" | "create" | "update" | "delete" | "withdraw" | "deposit" | "transfer" | "block";
export interface OperationParam {
    type: string;
    action?: OperationParamAction;
    value?: any;
    parser?: Function;
}
export interface ProcedureProposalOperationFunction {
    funcSig: string;
    key: string;
    signature?: string;
    label?: string;
    tags?: OperationTag[];
    params?: OperationParamType[];
    abi?: any;
    target?: "organ" | "self";
}
export interface ProcedureProposalOperation {
    index: string;
    functionSelector: string;
    organ?: Address;
    data: string;
    value?: string;
    processed?: boolean;
    function?: ProcedureProposalOperationFunction;
    params?: OperationParam[];
    userIsInOrgan?: boolean;
    userIsInEntry?: boolean;
    description?: any;
}
export interface ProcedureProposal {
    key: string;
    creator: Address;
    metadata: CID | undefined;
    blockReason: CID | undefined;
    presented: boolean;
    blocked: boolean;
    adopted: boolean;
    applied: boolean;
    operations: ProcedureProposalOperation[];
}
export default class Procedure {
    static INTERFACE: string;
    static OPERATIONS_PARAMS_TYPES: string[];
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    _contract: any;
    address: Address;
    metadata: CID | undefined;
    proposers: Address;
    moderators: Address;
    deciders: Address;
    withModeration: boolean;
    proposals: ProcedureProposal[];
    constructor(address: Address, metadata: CID | undefined, proposers: Address, moderators: Address, deciders: Address, withModeration: boolean, proposals: ProcedureProposal[]);
    static initialize(_address: Address, _metadata: CID, _proposers: Address, _moderators: Address, _deciders: Address, _withModeration: boolean, ..._args: any[]): Promise<void>;
    static loadData(address: Address): Promise<{
        metadata: CID | undefined;
        proposers: Address;
        moderators: Address;
        deciders: Address;
        withModeration: boolean;
        proposalsLength: string;
    }>;
    static loadProposal(address: Address, proposalKey: string): Promise<ProcedureProposal>;
    static loadProposals(address: Address): Promise<ProcedureProposal[]>;
    static load(address: Address): Promise<Procedure>;
    static _stringifyParamType(type: OperationParamType): string;
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    static parseOperation(_operation: any): ProcedureProposalOperation;
    static isProcedure(address: Address): Promise<boolean>;
    updateMetadata(cid: CID): Promise<boolean>;
    updateAdmin(address: Address): Promise<boolean>;
    propose(metadata: CID, operations: ProcedureProposalOperation[]): Promise<ProcedureProposal>;
    blockProposal(proposalKey: string, reason: CID): Promise<any>;
    presentProposal(proposalKey: string): Promise<any>;
    applyProposal(proposalKey: string): Promise<any>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
}
