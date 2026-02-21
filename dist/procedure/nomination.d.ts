import { ethers } from 'ethers';
import { Procedure, ProcedureInput } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, ProcedureTypeName } from './utils';
export declare class NominationProcedure extends Procedure {
    static INTERFACE: string;
    contract: ethers.Contract;
    type: {
        key: string;
        address: string;
        metadata: {
            label: string;
            description: string;
        };
    };
    typeName: ProcedureTypeName;
    constructor(procedureInput: ProcedureInput & {
        contract?: ethers.Contract;
    });
    static _populateInitialize(input: PopulateInitializeInput): Promise<ethers.ContractTransaction>;
    static load(address: string, signerOrProvider: ethers.Signer | ethers.Provider, initialProcedure?: ProcedureInput): Promise<NominationProcedure>;
    nominate(proposalKey: string, options?: TransactionOptions): Promise<boolean>;
}
