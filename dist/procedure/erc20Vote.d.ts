import { ethers } from 'ethers';
import { Procedure, type Election, ProcedureInput, PopulateInitializeInput, ProcedureTypeName } from '.';
import { TransactionOptions } from '../organigramClient';
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
        cid: string;
        label: string;
        description: string;
        type: string;
        _type: string;
        _generator: string;
        _generatedAt: number;
    };
};
export type ERC20VoteProcedureInput = ProcedureInput & {
    erc20: string;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
};
export declare class ERC20VoteProcedure extends Procedure {
    static INTERFACE: string;
    erc20: string;
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
    contract: ethers.Contract;
    type: {
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
            cid: string;
            label: string;
            description: string;
            type: string;
            _type: string;
            _generator: string;
            _generatedAt: number;
        };
    };
    typeName: ProcedureTypeName;
    constructor({ erc20, quorumSize, voteDuration, majoritySize, elections, ...procedureArguments }: ERC20VoteProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput): Promise<ethers.ContractTransaction>;
    static loadElection(address: string, proposalKey: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Election>;
    static loadElections(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Election[]>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider): Promise<ERC20VoteProcedure>;
    erc20Balance(account?: string): Promise<bigint>;
    vote(proposalKey: string, approval: boolean, options: TransactionOptions): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
}
