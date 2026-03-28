import type { Abi, Account, Address, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem';
export type ContractClients = {
    publicClient: PublicClient;
    walletClient?: WalletClient | null;
};
export type OrganigramTransactionReceipt = TransactionReceipt & {
    gasPrice?: bigint | null;
};
export type OrganigramTransaction = {
    hash: Hex;
    wait: () => Promise<OrganigramTransactionReceipt>;
};
export declare const bufferEstimatedGas: (estimatedGas: bigint) => bigint;
export declare const getWalletAccount: (walletClient: WalletClient) => Promise<Account | Address>;
export declare const getWalletAddress: (walletClient: WalletClient) => Promise<Address>;
export declare const getContractInstance: <TAbi extends Abi | readonly unknown[]>({ address, abi, publicClient, walletClient }: {
    address: string;
    abi: TAbi;
} & ContractClients) => {
    read: {
        [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
    };
    estimateGas: {
        [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
    } & {
        [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
    };
    simulate: {
        [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends Account | Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
    };
    createEventFilter: {
        [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined] | [args: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            strict?: undefined;
            toBlock?: undefined;
            args?: undefined;
        }, options?: ({
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
    };
    getEvents: {
        [x: string]: (...parameters: [options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } | undefined] | [args?: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            args?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            onError?: undefined;
            onLogs?: undefined;
            strict?: undefined;
            poll?: undefined;
            batch?: undefined;
            pollingInterval?: undefined;
        } | undefined, options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } | undefined]) => Promise<import("viem").GetContractEventsReturnType<Abi, string>>;
    };
    watchEvent: {
        [x: string]: (...parameters: [options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: import("viem").WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined] | [args: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            args?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            onError?: undefined;
            onLogs?: undefined;
            strict?: undefined;
            poll?: undefined;
            batch?: undefined;
            pollingInterval?: undefined;
        }, options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: import("viem").WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined]) => import("viem").WatchContractEventReturnType;
    };
    write: {
        [x: string]: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, undefined, chainOverride>, "address" | "abi" | "functionName" | "args"> extends infer T ? { [K in keyof T]: T[K]; } : never, Rest extends unknown[] = [options: options]>(...parameters: Rest | [args: readonly unknown[], ...parameters: Rest]) => Promise<import("viem").WriteContractReturnType>;
    };
    address: `0x${string}`;
    abi: Abi;
} | {
    read: {
        [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
    };
    estimateGas: {
        [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
    } & {
        [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
    };
    simulate: {
        [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends Account | Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
    };
    createEventFilter: {
        [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined] | [args: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            strict?: undefined;
            toBlock?: undefined;
            args?: undefined;
        }, options?: ({
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
    };
    getEvents: {
        [x: string]: (...parameters: [options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } | undefined] | [args?: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            args?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            onError?: undefined;
            onLogs?: undefined;
            strict?: undefined;
            poll?: undefined;
            batch?: undefined;
            pollingInterval?: undefined;
        } | undefined, options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | import("viem").BlockTag | undefined;
            toBlock?: bigint | import("viem").BlockTag | undefined;
        } | undefined]) => Promise<import("viem").GetContractEventsReturnType<Abi, string>>;
    };
    watchEvent: {
        [x: string]: (...parameters: [options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: import("viem").WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined] | [args: readonly unknown[] | {
            [x: string]: unknown;
            address?: undefined;
            abi?: undefined;
            args?: undefined;
            eventName?: undefined;
            fromBlock?: undefined;
            onError?: undefined;
            onLogs?: undefined;
            strict?: undefined;
            poll?: undefined;
            batch?: undefined;
            pollingInterval?: undefined;
        }, options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: import("viem").WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined]) => import("viem").WatchContractEventReturnType;
    };
    write: {
        [x: string]: <chainOverride extends import("viem").Chain | undefined, options extends import("viem").UnionOmit<import("viem").WriteContractParameters<Abi, string, readonly unknown[], import("viem").Chain | undefined, Account | undefined, chainOverride>, "address" | "abi" | "functionName" | "args"> extends infer T ? { [K in keyof T]: T[K]; } : never, Rest extends unknown[] = [options: options]>(...parameters: Rest | [args: readonly unknown[], ...parameters: Rest]) => Promise<import("viem").WriteContractReturnType>;
    };
    address: `0x${string}`;
    abi: Abi;
};
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
