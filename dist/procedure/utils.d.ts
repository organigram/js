import { DeployOrganInput, DeployProceduresInput, TransactionOptions } from '../organigramClient';
import type { ContractClients } from '../contracts';
import type { ProcedureType } from './index';
export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote';
export type ERC20VoteRoleMode = 'organ' | 'token' | 'disabled';
export declare enum ProcedureTypeNameEnum {
    erc20Vote = "erc20Vote",
    nomination = "nomination",
    vote = "vote"
}
export interface PopulateInitializeInput {
    options?: TransactionOptions;
    typeName?: ProcedureTypeName;
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    proposerMode?: ERC20VoteRoleMode;
    moderatorMode?: ERC20VoteRoleMode;
    voterMode?: ERC20VoteRoleMode;
    requireMemberMajority?: boolean;
    forwarder: string;
    args: unknown[];
}
export type PopulatedTransactionData = {
    data: string;
};
export declare const electionFields: {
    quorumSize: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: string;
    };
    voteDuration: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: string;
    };
    majoritySize: {
        name: string;
        label: string;
        description: string;
        defaultValue: string;
        type: string;
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
                type: string;
            };
            readonly voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            readonly majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
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
                type: string;
            };
            voteDuration: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
            majoritySize: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
        };
        readonly metadata: {
            readonly label: "Simple Majority Vote";
            readonly description: "A vote allows any user in the source organ to vote on proposals to add, edit or replace one or many entries, assets or permissions in the target organ.";
        };
    };
};
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
export declare const prepareDeployProceduresInput: (deployProceduresInput: DeployProceduresInput[], clients: ContractClients) => Promise<{
    procedureType: string;
    data: string;
    salt: string;
    options: TransactionOptions | undefined;
}[]>;
export declare const getProcedureClass: (typeName: string) => Promise<typeof import("./erc20Vote").ERC20VoteProcedure | typeof import("./vote").VoteProcedure | typeof import("./nomination").NominationProcedure>;
export declare const populateInitializeProcedure: (input: PopulateInitializeInput, clients: ContractClients) => Promise<PopulatedTransactionData>;
export declare const encodeProcedureInitialization: (abi: unknown, functionName: string, args: unknown[]) => PopulatedTransactionData;
