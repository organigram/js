import { Procedure, type ProcedureInput } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, PopulatedTransactionData, ProcedureTypeName } from './utils';
import { type ContractClients } from '../contracts';
export declare class NominationProcedure extends Procedure {
    static INTERFACE: string;
    contract?: any;
    type: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
        fields: {};
    };
    typeName: ProcedureTypeName;
    constructor(procedureInput: ProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<NominationProcedure>;
    nominate(proposalKey: string, options?: TransactionOptions): Promise<boolean>;
    signNomination(input: {
        proposalKey: string;
        nonce: bigint;
        deadline: bigint | number;
    }): Promise<string>;
    nominateBySig(input: {
        proposalKey: string;
        nonce: bigint;
        deadline: bigint | number;
        signature: string;
    }): Promise<boolean>;
}
