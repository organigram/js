import { Procedure, type Election, type ProcedureInput, type ProcedureJson } from '../procedure';
import { type TransactionOptions } from '../organigramClient';
import { type PopulateInitializeInput, type PopulatedTransactionData, ProcedureTypeName } from './utils';
import { type ContractClients } from '../contracts';
export type VoteProcedureInput = ProcedureInput & {
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
};
export declare class VoteProcedure extends Procedure {
    static INTERFACE: string;
    contract?: any;
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
    constructor({ quorumSize, voteDuration, majoritySize, elections, ...procedureInput }: VoteProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput, clients: ContractClients): Promise<PopulatedTransactionData>;
    static loadElection(address: string, proposalKey: string, clients: ContractClients, voteDuration?: bigint, contract?: any): Promise<Election>;
    static loadElections(address: string, clients: ContractClients, proposalsLength?: number): Promise<Election[]>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<VoteProcedure>;
    vote(proposalKey: string, approval: boolean, options?: TransactionOptions): Promise<boolean>;
    signVote(input: {
        proposalKey: string;
        approval: boolean;
        nonce: bigint;
        deadline: bigint | number;
    }): Promise<string>;
    voteBySig(input: {
        proposalKey: string;
        approval: boolean;
        nonce: bigint;
        deadline: bigint | number;
        signature: string;
    }): Promise<boolean>;
    count(proposalKey: string): Promise<boolean>;
    toJson: () => ProcedureJson;
}
