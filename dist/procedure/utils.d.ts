import { ethers, ContractTransaction } from 'ethers';
import { DeployOrganInput, DeployProceduresInput, TransactionOptions } from '../organigramClient';
export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote';
export declare enum ProcedureTypeNameEnum {
    erc20Vote = "erc20Vote",
    nomination = "nomination",
    vote = "vote"
}
export interface PopulateInitializeInput {
    options?: {
        signer?: ethers.Signer;
    } & TransactionOptions;
    typeName?: ProcedureTypeName;
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    forwarder: string;
    args: unknown[];
}
export declare const nomination: {
    key: string;
    address: string;
    metadata: {
        label: string;
        description: string;
    };
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
export declare const vote: {
    key: string;
    address: string;
    metadata: {
        label: string;
        description: string;
    };
    fields: {
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
};
export declare const procedureMetadata: {
    _type: string;
    _generator: string;
    _generatedAt: number;
};
export declare const erc20Vote: {
    address: string;
    key: string;
    fields: {
        erc20: {
            name: string;
            label: string;
            description: string;
            defaultValue: string;
            type: string;
        };
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
    metadata: {
        label: string;
        description: string;
        type: string;
        _type: string;
        _generator: string;
        _generatedAt: number;
    };
};
export declare const procedureTypes: {
    erc20Vote: {
        address: string;
        key: string;
        fields: {
            erc20: {
                name: string;
                label: string;
                description: string;
                defaultValue: string;
                type: string;
            };
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
        metadata: {
            label: string;
            description: string;
            type: string;
            _type: string;
            _generator: string;
            _generatedAt: number;
        };
    };
    nomination: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
    };
    vote: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
        fields: {
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
    };
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
export declare const prepareDeployProceduresInput: (deployProceduresInput: DeployProceduresInput[], signer: ethers.Signer) => Promise<{
    procedureType: string;
    data: string;
    salt: string;
    options: TransactionOptions | undefined;
}[]>;
export declare const getProcedureClass: (typeName: string) => Promise<typeof import("./vote").VoteProcedure | typeof import("./erc20Vote").ERC20VoteProcedure | typeof import("./nomination").NominationProcedure>;
export declare const populateInitializeProcedure: (input: PopulateInitializeInput, signer: ethers.Signer) => Promise<ContractTransaction>;
