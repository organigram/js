import { DeployOrganInput, DeployProceduresInput, TransactionOptions } from '../organigramClient';
import type { ContractClients } from '../contracts';
import type { ProcedureType } from './index';
export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote';
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
                readonly label: "ERC20 Token";
                readonly description: "Address of the ERC20 Token used for weighting the voting power.";
                readonly defaultValue: "";
                readonly type: "string";
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
            readonly description: "A token vote allows any member in the source organ to vote on proposals, where their voting power is based on the amount of tokens they hold.";
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
export declare const getProcedureTypes: (chainId?: string) => {
    erc20Vote: ProcedureType;
    nomination: ProcedureType;
    vote: ProcedureType;
};
export declare const getProcedureType: (chainId: string, typeName: ProcedureTypeName) => ProcedureType;
export declare const procedureTypes: {
    erc20Vote: ProcedureType;
    nomination: ProcedureType;
    vote: ProcedureType;
};
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
export declare const getProcedureClass: (typeName: string) => Promise<typeof import("./vote").VoteProcedure | typeof import("./erc20Vote").ERC20VoteProcedure | typeof import("./nomination").NominationProcedure>;
export declare const populateInitializeProcedure: (input: PopulateInitializeInput, clients: ContractClients) => Promise<PopulatedTransactionData>;
export declare const encodeProcedureInitialization: (abi: unknown, functionName: string, args: unknown[]) => PopulatedTransactionData;
