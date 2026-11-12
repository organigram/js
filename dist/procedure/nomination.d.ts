import { Procedure, type ProcedureInput } from '.';
import { TransactionOptions } from '../organigramClient';
import { PopulateInitializeInput, PopulatedTransactionData, ProcedureTypeName } from './utils';
import { type ContractClients, type OrganigramContract } from '../contracts';
/**
 * A procedure in which any one member of the deciders adopts or rejects a proposal alone.
 */
export declare class NominationProcedure extends Procedure {
    /** ERC-165 interface identifier of nomination procedures. */
    static INTERFACE: string;
    /** viem contract instance, once loaded. */
    contract?: OrganigramContract;
    /** Always `nomination`. */
    typeName: ProcedureTypeName;
    constructor(procedureInput: ProcedureInput);
    /** @internal */
    static _populateInitialize(input: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    /** Read a nomination procedure from chain, with its proposals. */
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<NominationProcedure>;
    /** Adopt a proposal as a decider, which runs its operations. */
    nominate(proposalKey: string, options?: TransactionOptions): Promise<void>;
    /** Reject a proposal as a decider. */
    reject(proposalKey: string, options?: TransactionOptions): Promise<void>;
    /**
     * Sign the adoption of a proposal, for `nominateBySig()`.
     *
     * @remarks The signer pays no gas: any account can submit the signature with the matching `…BySig` method.
     */
    signNomination(input: {
        proposalKey: string;
        nonce: bigint;
        deadline: bigint | number;
    }): Promise<string>;
    /** Adopt a proposal with an adoption signed by a decider. */
    nominateBySig(input: {
        proposalKey: string;
        nonce: bigint;
        deadline: bigint | number;
        signature: string;
    }): Promise<void>;
}
