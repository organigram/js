import type { Abi, Account, Address, GetContractReturnType, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem';
/** The viem clients the SDK reads and writes with. */
export type ContractClients = {
    /** Client used for every read. */
    publicClient: PublicClient;
    /** Client that signs transactions. Without it, the SDK is read-only. */
    walletClient?: WalletClient | null;
};
/** The receipt of a mined transaction. */
export type OrganigramTransactionReceipt = TransactionReceipt & {
    gasPrice?: bigint | null;
};
/** A sent transaction, with a `wait()` that resolves once it is mined. */
export type OrganigramTransaction = {
    /** Transaction hash. */
    hash: Hex;
    /** Wait for the transaction to be mined, and throw if it reverted. */
    wait: () => Promise<OrganigramTransactionReceipt>;
};
/** Add a 20% margin plus 25,000 gas to a gas estimate. */
export declare const bufferEstimatedGas: (estimatedGas: bigint) => bigint;
export declare const getWalletAccount: (walletClient: WalletClient) => Promise<Account | Address>;
/** Return the address of the account a wallet client signs with. */
export declare const getWalletAddress: (walletClient: WalletClient) => Promise<Address>;
/** A viem contract instance bound to the SDK clients. */
export type OrganigramContract = GetContractReturnType<Abi, PublicClient | {
    public: PublicClient;
    wallet: WalletClient;
}>;
export declare const getContractInstance: <TAbi extends Abi | readonly unknown[]>({ address, abi, publicClient, walletClient }: {
    address: string;
    abi: TAbi;
} & ContractClients) => OrganigramContract;
/**
 * Send a contract call with a buffered gas estimate, and return it as an `OrganigramTransaction`.
 */
export declare const createContractWriteTransaction: <TAbi extends Abi | readonly unknown[]>({ address, abi, functionName, args, clients, nonce, value }: {
    address: string;
    abi: TAbi;
    functionName: string;
    args?: unknown[];
    clients: ContractClients;
    nonce?: number;
    value?: bigint;
}) => Promise<OrganigramTransaction>;
export declare const createDeployTransaction: <TAbi extends Abi | readonly unknown[]>({ abi, bytecode, args, clients, nonce, value }: {
    abi: TAbi;
    bytecode: string;
    args?: unknown[];
    clients: ContractClients;
    nonce?: number;
    value?: bigint;
}) => Promise<OrganigramTransaction>;
