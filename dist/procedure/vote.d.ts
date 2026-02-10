import { ethers } from 'ethers';
import { Procedure, type Election, ProcedureInput, ProcedureTypeName, PopulateInitializeInput } from '../procedure';
import { type TransactionOptions } from '../organigramClient';
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
export type VoteProcedureInput = ProcedureInput & {
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
};
export declare class VoteProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    typeName: ProcedureTypeName;
    type: {
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
    constructor({ quorumSize, voteDuration, majoritySize, elections, salt, ...procedureInput }: VoteProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput): Promise<ethers.ContractTransaction>;
    static loadElection(address: string, proposalKey: string, signer: ethers.Signer): Promise<Election>;
    static loadElections(address: string, signer: ethers.Signer): Promise<Election[]>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<VoteProcedure>;
    vote(proposalKey: string, approval: boolean, options?: TransactionOptions): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
}
