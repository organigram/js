import { DeployOrganInput, DeployProcedureInput, TransactionOptions } from '../organigramClient';
import type { ContractClients } from '../contracts';
import type { ProcedureType } from './index';
/** Name of a procedure type. */
export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote';
/**
 * Who holds a role in an ERC-20 vote: the members of an organ, the token holders, or nobody.
 */
export type ERC20VoteRoleMode = 'organ' | 'token' | 'disabled';
export declare enum ProcedureTypeNameEnum {
    erc20Vote = "erc20Vote",
    nomination = "nomination",
    vote = "vote"
}
/** Everything needed to encode the initialization of a procedure clone. */
export interface PopulateInitializeInput {
    /** Transaction options. */
    options?: TransactionOptions;
    /** Procedure type. */
    typeName?: ProcedureTypeName;
    /** Reference to the procedure metadata. */
    cid: string;
    /** Proposers organ or address. */
    proposers: string;
    /** Moderators organ or address. */
    moderators: string;
    /** Deciders organ or address. */
    deciders: string;
    /** Whether moderation is enabled. */
    withModeration: boolean;
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
    /** Trusted forwarder relaying gasless transactions. */
    forwarder: string;
    /** Parameters specific to the procedure type, as hex strings. */
    args: unknown[];
}
/** Encoded call data. */
export type PopulatedTransactionData = {
    data: string;
};
export declare const electionFields: {
    quorumSize: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: "number";
    };
    voteDuration: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: "number";
    };
    majoritySize: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: "number";
    };
};
export declare const procedureMetadata: {
    _type: string;
    _generator: string;
    _generatedAt: number;
};
export declare const procedureTypeMetadata: {
    readonly erc20Vote: {
        readonly key: "erc20Vote";
        readonly fields: {
            readonly erc20: {
                readonly name: "erc20";
                readonly label: "ERC20Votes Token";
                readonly description: "Address of the ERC20Votes-compatible token used for weighting the voting power.";
                readonly defaultValue: "";
                readonly type: "string";
            };
            readonly proposerMode: {
                readonly name: "proposerMode";
                readonly label: "Proposal creation rights";
                readonly description: "Choose whether proposal creation is authorized by the source organ or by token holders.";
                readonly defaultValue: "organ";
                readonly type: "roleMode";
            };
            readonly moderatorMode: {
                readonly name: "moderatorMode";
                readonly label: "Moderation rights";
                readonly description: "Choose whether moderation is disabled, authorized by the source organ, or authorized by token holders.";
                readonly defaultValue: "organ";
                readonly type: "moderatorRoleMode";
            };
            readonly voterMode: {
                readonly name: "voterMode";
                readonly label: "Voting rights";
                readonly description: "Choose whether voting is authorized by the source organ or by token holders.";
                readonly defaultValue: "organ";
                readonly type: "roleMode";
            };
            readonly requireMemberMajority: {
                readonly name: "requireMemberMajority";
                readonly label: "Member majority required";
                readonly description: "When voters are members of an organ, require more than half of those members to approve in addition to the token-weighted vote.";
                readonly defaultValue: "false";
                readonly type: "boolean";
            };
            readonly quorumSize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
            readonly voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
            readonly majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
        };
        readonly metadata: {
            readonly label: "Token-weighted Vote";
            readonly description: "A token vote allows any member in the source organ to vote on proposals, where their voting power is based on their delegated token votes at the proposal snapshot.";
            readonly type: "erc20Vote";
            readonly _type: string;
            readonly _generator: string;
            readonly _generatedAt: number;
        };
    };
    readonly nomination: {
        readonly key: "nomination";
        readonly fields: {};
        readonly metadata: {
            readonly label: "Nomination";
            readonly description: "A nomination allows any member in the source organ to directly edit entries, assets or permissions in the target organ.";
        };
    };
    readonly vote: {
        readonly key: "vote";
        readonly fields: {
            quorumSize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
            voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
            majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: "number";
            };
        };
        readonly metadata: {
            readonly label: "Simple Majority Vote";
            readonly description: "A vote allows any user in the source organ to vote on proposals to add, edit or replace one or many entries, assets or permissions in the target organ.";
        };
    };
};
/** Return the procedure types registered on a chain. */
export declare const getProcedureTypes: (chainId?: string) => Partial<Record<ProcedureTypeName, ProcedureType>>;
export declare const getProcedureType: (chainId: string, typeName: ProcedureTypeName) => ProcedureType;
export declare const procedureTypes: Partial<Record<ProcedureTypeName, ProcedureType>>;
export declare const prepareDeployOrgansInput: (deployOrgansInput: DeployOrganInput[]) => {
    permissionAddresses: string[];
    permissionValues: string[];
    cid: string;
    entries: {
        addr: string;
        cid: string;
    }[];
    salt: string;
}[];
export declare const prepareDeployProceduresInput: (deployProceduresInput: DeployProcedureInput[], clients: ContractClients) => Promise<{
    procedureType: string;
    data: string;
    salt: string;
    options: TransactionOptions | undefined;
}[]>;
/** Return the SDK class of a procedure type. */
export declare const getProcedureClass: (typeName: string) => Promise<typeof import("./erc20Vote").ERC20VoteProcedure | typeof import("./vote").VoteProcedure | typeof import("./nomination").NominationProcedure>;
export declare const populateInitializeProcedure: (input: PopulateInitializeInput, clients: ContractClients) => Promise<PopulatedTransactionData>;
export declare const encodeProcedureInitialization: (abi: unknown, functionName: string, args: unknown[]) => PopulatedTransactionData;
