import { ProcedureInput, ProcedureJson } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, PopulatedTransactionData, ProcedureTypeName } from './utils';
import { VoteProcedure, VoteProcedureInput } from './vote';
import { type ContractClients } from '../contracts';
export type ERC20VoteProcedureInput = Omit<VoteProcedureInput, 'type' | 'typeName'> & {
    erc20: string;
};
export declare class ERC20VoteProcedure extends VoteProcedure {
    static INTERFACE: string;
    erc20: string;
    contract?: any;
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
            label: string;
            description: string;
            type: string;
            _type: string;
            _generator: string;
            _generatedAt: number;
        };
    };
    typeName: ProcedureTypeName;
    constructor({ erc20, ...voteProcedureArguments }: ERC20VoteProcedureInput);
    static _populateInitialize(input: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<ERC20VoteProcedure>;
    erc20Balance(account?: string): Promise<bigint>;
    vote(proposalKey: string, approval: boolean, options: TransactionOptions): Promise<boolean>;
    toJson: () => ProcedureJson;
}
