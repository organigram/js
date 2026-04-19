import type { Abi } from 'viem';
import type { Account } from 'viem';
import type { Address } from 'viem';
import { BlockTag } from 'viem';
import { Chain } from 'viem';
import { CreateContractEventFilterReturnType } from 'viem';
import { EstimateContractGasParameters } from 'viem';
import { EstimateContractGasReturnType } from 'viem';
import { GetContractEventsReturnType } from 'viem';
import type { Hex } from 'viem';
import { Prettify } from 'viem';
import { PublicClient } from 'viem';
import { ReadContractParameters } from 'viem';
import { ReadContractReturnType } from 'viem';
import { SimulateContractParameters } from 'viem';
import { SimulateContractReturnType } from 'viem';
import type { TransactionReceipt } from 'viem';
import { UnionOmit } from 'viem';
import { WalletClient } from 'viem';
import { WatchContractEventOnLogsFn } from 'viem';
import { WatchContractEventReturnType } from 'viem';
import { WriteContractParameters } from 'viem';
import { WriteContractReturnType } from 'viem';

export declare type AccountInOrgans = {
    moderators?: boolean;
    proposers?: boolean;
    deciders?: boolean;
};

/**
 * In-memory representation of one ERC-20 asset managed by an organigram.
 */
export declare class Asset {
    address: string;
    name: string;
    description: string;
    symbol: string;
    initialSupply: number;
    chainId: string;
    salt?: string | null;
    image?: string | null;
    isDeployed: boolean;
    userBalance: string;
    organigramId?: string | null;
    constructor(input: AssetInput);
    /**
     * Hydrate an asset from chain state.
     *
     * @param address Asset contract address.
     * @param clients viem clients used to query the contract.
     * @param initialAsset Optional fallback metadata merged into the loaded asset.
     */
    static load: (address: string, clients: ContractClients, initialAsset?: AssetInput) => Promise<(Asset & {
        userBalance: string;
    }) | undefined>;
    /**
     * Convert the asset into a JSON-safe structure.
     */
    toJson(): AssetJson;
}

/**
 * Input used to create or hydrate an asset model.
 */
export declare interface AssetInput {
    name?: string | null;
    description?: string | null;
    address?: string | null;
    symbol?: string | null;
    initialSupply?: number | null;
    chainId?: string | null;
    salt?: string | null;
    image?: string | null;
    isDeployed?: boolean;
    userBalance?: string | null;
    organigramId?: string | null;
}

/**
 * JSON-safe serialized representation of one asset.
 */
export declare interface AssetJson {
    address: string;
    isDeployed: boolean;
    name: string;
    symbol: string;
    initialSupply: number;
    chainId: string;
    salt?: string | null;
    image?: string | null;
    userBalance: string;
    organigramId?: string | null;
}

export declare const bufferEstimatedGas: (estimatedGas: bigint) => bigint;

export declare const capitalize: (s: string) => string;

export declare function cloneInitCodeHash(implementation: string): string;

export declare type ContractClients = {
    publicClient: PublicClient;
    walletClient?: WalletClient | null;
};

export declare type ContractName = 'Organ' | 'Asset' | 'ERC20VoteProcedure' | 'VoteProcedure' | 'NominationProcedure' | 'OrganigramClient';

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

export declare const createRandom32BytesHexId: () => `0x${string}`;

/**
 * Default Sepolia chain id used by the SDK templates.
 */
export declare const defaultChainId = "11155111";

/**
 * Input used to deploy one ERC-20 asset contract.
 */
export declare interface DeployAssetInput {
    name: string;
    symbol: string;
    initialSupply?: number | null;
    salt?: string | null;
}

export declare const deployedAddresses: ProtocolDeployments;

/**
 * Batch deployment input for a full organigram.
 */
export declare interface DeployOrganigramInput {
    organs: DeployOrganInput[];
    assets: DeployAssetInput[];
    procedures: DeployProceduresInput[];
}

/**
 * Input used to deploy one organ through an {@link OrganigramClient}.
 */
export declare interface DeployOrganInput {
    cid?: string;
    permissions?: OrganPermission[];
    entries?: OrganEntry[];
    salt?: string | null;
    options?: TransactionOptions;
}

/**
 * Input used to deploy one procedure instance from a registered procedure type.
 */
export declare interface DeployProceduresInput {
    typeName: ProcedureTypeName;
    chainId?: string | null;
    cid?: string | null;
    proposers?: string | null;
    moderators?: string | null;
    deciders: string;
    withModeration?: boolean | null;
    forwarder?: string | null;
    salt?: string | null;
    options?: TransactionOptions;
    data?: string;
    args?: unknown[];
}

/**
 * Current election state for one vote-based proposal.
 */
export declare type Election = {
    proposalKey: string;
    start: string;
    votesCount: string;
    hasVoted: boolean;
    approved?: boolean;
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

export declare const encodeProcedureInitialization: (abi: unknown, functionName: string, args: unknown[]) => PopulatedTransactionData;

export declare const ERC20_INITIAL_SUPPLY = 10000000;

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

export declare type ERC20VoteProcedureInput = Omit<VoteProcedureInput, 'type' | 'typeName'> & {
    erc20: string;
};

export declare interface ExternalCallOperationInput {
    organAddress: string;
    target: string;
    data: string;
    value?: string | bigint | number;
    index?: string | number;
}

/**
 * In-memory representation of a CID-backed file managed by the client.
 */
declare interface File_2 {
    cid: string;
    data: unknown;
}
export { File_2 as File }

export declare const formatSalt: (salt?: string | null) => string;

export declare const getContractInstance: <TAbi extends Abi | readonly unknown[]>({ address, abi, publicClient, walletClient }: {
    address: string;
    abi: TAbi;
} & ContractClients) => {
    read: {
        [x: string]: (...parameters: [options?: Prettify<UnionOmit<ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: Prettify<UnionOmit<ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<ReadContractReturnType>;
    };
    estimateGas: {
        [x: string]: (...parameters: [options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<EstimateContractGasReturnType>;
    } & {
        [x: string]: (...parameters: [options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<EstimateContractGasReturnType>;
    };
    simulate: {
        [x: string]: <chainOverride extends Chain | undefined = undefined, accountOverride extends Account | Address | undefined = undefined>(...parameters: [options?: Omit<SimulateContractParameters<Abi, string, readonly unknown[], Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<SimulateContractParameters<Abi, string, readonly unknown[], Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<SimulateContractReturnType>;
    };
    createEventFilter: {
        [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
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
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined]) => Promise<CreateContractEventFilterReturnType>;
    };
    getEvents: {
        [x: string]: (...parameters: [options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
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
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
        } | undefined]) => Promise<GetContractEventsReturnType<Abi, string>>;
    };
    watchEvent: {
        [x: string]: (...parameters: [options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: WatchContractEventOnLogsFn<Abi, string, undefined>;
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
            onLogs: WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined]) => WatchContractEventReturnType;
    };
    write: {
        [x: string]: <chainOverride extends Chain | undefined, options extends UnionOmit<WriteContractParameters<Abi, string, readonly unknown[], Chain | undefined, undefined, chainOverride>, "address" | "abi" | "functionName" | "args"> extends infer T ? { [K in keyof T]: T[K]; } : never, Rest extends unknown[] = [options: options]>(...parameters: Rest | [args: readonly unknown[], ...parameters: Rest]) => Promise<WriteContractReturnType>;
    };
    address: `0x${string}`;
    abi: Abi;
} | {
    read: {
        [x: string]: (...parameters: [options?: Prettify<UnionOmit<ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: Prettify<UnionOmit<ReadContractParameters<Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<ReadContractReturnType>;
    };
    estimateGas: {
        [x: string]: (...parameters: [options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<EstimateContractGasReturnType>;
    } & {
        [x: string]: (...parameters: [options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: Prettify<UnionOmit<EstimateContractGasParameters<Abi, string, readonly unknown[], Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<EstimateContractGasReturnType>;
    };
    simulate: {
        [x: string]: <chainOverride extends Chain | undefined = undefined, accountOverride extends Account | Address | undefined = undefined>(...parameters: [options?: Omit<SimulateContractParameters<Abi, string, readonly unknown[], Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<SimulateContractParameters<Abi, string, readonly unknown[], Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<SimulateContractReturnType>;
    };
    createEventFilter: {
        [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
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
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
        } & {
            strict?: strict | undefined;
        }) | undefined]) => Promise<CreateContractEventFilterReturnType>;
    };
    getEvents: {
        [x: string]: (...parameters: [options?: {
            strict?: boolean | undefined;
            blockHash?: `0x${string}` | undefined;
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
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
            fromBlock?: bigint | BlockTag | undefined;
            toBlock?: bigint | BlockTag | undefined;
        } | undefined]) => Promise<GetContractEventsReturnType<Abi, string>>;
    };
    watchEvent: {
        [x: string]: (...parameters: [options?: {
            batch?: boolean | undefined | undefined;
            pollingInterval?: number | undefined | undefined;
            strict?: boolean | undefined;
            fromBlock?: bigint | undefined;
            onError?: ((error: Error) => void) | undefined | undefined;
            onLogs: WatchContractEventOnLogsFn<Abi, string, undefined>;
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
            onLogs: WatchContractEventOnLogsFn<Abi, string, undefined>;
            poll?: true | undefined | undefined;
        } | undefined]) => WatchContractEventReturnType;
    };
    write: {
        [x: string]: <chainOverride extends Chain | undefined, options extends UnionOmit<WriteContractParameters<Abi, string, readonly unknown[], Chain | undefined, Account | undefined, chainOverride>, "address" | "abi" | "functionName" | "args"> extends infer T ? { [K in keyof T]: T[K]; } : never, Rest extends unknown[] = [options: options]>(...parameters: Rest | [args: readonly unknown[], ...parameters: Rest]) => Promise<WriteContractReturnType>;
    };
    address: `0x${string}`;
    abi: Abi;
};

export declare const getPermissionsSet: (permissions: number) => string[];

export declare const getProcedureClass: (typeName: string) => Promise<VoteProcedure | ERC20VoteProcedure | NominationProcedure>;

export declare const getTemplate: (templateName: TemplateName, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        isDeployed: boolean;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        publicClient?: PublicClient | null;
        walletClient?: WalletClient | null;
        balance?: string | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        name?: string | null;
        description?: string | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        data: string;
        isDeployed: boolean;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        publicClient?: PublicClient | null;
        walletClient?: WalletClient | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: ProcedureProposal[] | null;
        organigramId?: string | null;
    }[];
    assets: {
        chainId: string;
        isDeployed: boolean;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        symbol?: string | null;
        initialSupply?: number | null;
        image?: string | null;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};

export declare const getWalletAccount: (walletClient: WalletClient) => Promise<Account | Address>;

export declare const getWalletAddress: (walletClient: WalletClient) => Promise<Address>;

export declare const handleJsonBigInt: (key: string, value: any) => any;

/**
 * Entry payload used when creating or updating an organ entry.
 */
export declare interface IOrganEntry {
    address?: string;
    cid?: string;
}

export declare const nomination: {
    key: string;
    address: string;
    metadata: {
        label: string;
        description: string;
    };
    fields: {};
};

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

export declare interface OperationParam {
    type: OperationParamType;
    action?: OperationParamAction;
    value?: unknown;
    parser?: unknown;
}

export declare type OperationParamAction = 'select' | 'create' | 'update' | 'delete' | 'withdraw' | 'deposit' | 'transfer' | 'block';

export declare type OperationParamType = 'cid' | 'entry' | 'entries' | 'address' | 'bytes' | 'addresses' | 'index' | 'indexes' | 'organ' | 'oldPermissionAddress' | 'newPermissionAddress' | 'permissionAddress' | 'permissionValue' | 'proposal' | 'proposals' | 'amount' | 'tokenId';

export declare type OperationTag = 'cid' | 'entries' | 'permissions' | 'coins' | 'collectibles' | 'erc721' | 'erc20' | 'erc1155' | 'ether' | 'add' | 'replace' | 'remove' | 'deposit' | 'withdraw' | 'transfer';

/**
 * In-memory representation of one deployed or planned organ.
 */
export declare class Organ {
    static INTERFACE: string;
    name: string;
    description: string;
    address: string;
    salt: string | undefined;
    chainId: string;
    balance: string;
    permissions: OrganPermission[];
    cid: string;
    entries: OrganEntry[];
    walletClient?: WalletClient;
    publicClient?: PublicClient;
    contract?: any;
    isDeployed: boolean;
    organigramId: string;
    forwarder: string;
    constructor({ address, chainId, publicClient, walletClient, balance, permissions, cid, entries, salt, isDeployed, name, description, organigramId, forwarder }: OrganInput);
    private getClients;
    private getContract;
    updateCid: (cid: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    addEntries: (entries: IOrganEntry[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    replaceEntry: (index: number, entry: OrganEntry, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    addPermission: (permission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    removePermission: (permission: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    replacePermission: (oldPermissionAddress: string, newOrganPermission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawEther: (to: string, value: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawERC20: (token: string, to: string, amount: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    withdrawERC721: (token: string, to: string, tokenId: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    static load(address: string, clients: ContractClients, initialOrgan?: OrganInput): Promise<Organ>;
    static isOrgan(address: string, clients: ContractClients): Promise<boolean>;
    static getBalance(address: string, clients: ContractClients): Promise<bigint>;
    static loadData(address: string, clients: ContractClients): Promise<OrganContractData>;
    static loadEntryForAccount(address: string, account: string, clients: ContractClients): Promise<OrganEntry | undefined>;
    static checkAddressPermissions(organAddress: string, addressToCheck: string, clients: ContractClients): Promise<number>;
    static loadPermission(address: string, index: string, clients: ContractClients): Promise<OrganPermission>;
    static loadPermissions(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganPermission[]>;
    static loadEntry(address: string, index: string, clients: ContractClients): Promise<OrganEntry>;
    static loadEntries(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganEntry[]>;
    static populateTransaction(address: string, walletClient: WalletClient, functionName: OrganFunctionName | string, ...args: unknown[]): Promise<{
        to: string;
        data: string;
        functionName: string;
    }>;
    reload(): Promise<Organ>;
    reloadEntries(): Promise<Organ>;
    reloadPermissions(): Promise<Organ>;
    reloadData(): Promise<Organ>;
    toJson: () => OrganJson;
}

declare type OrganContractData = {
    cid: string;
    permissionsLength: bigint;
    entriesLength: bigint;
    entriesCount: bigint;
};

export declare interface OrganEntry {
    index: string;
    address: string;
    cid: string;
}

/**
 * High-level names for the writable organ functions exposed by the SDK.
 */
export declare enum OrganFunctionName {
    addEntries = "addEntries",
    removeEntries = "removeEntries",
    replaceEntry = "replaceEntry",
    addPermission = "addPermission",
    removePermission = "removePermission",
    replacePermission = "replacePermission",
    withdrawEther = "withdrawEther",
    withdrawERC20 = "withdrawERC20",
    withdrawERC721 = "withdrawERC721"
}

/**
 * In-memory representation of an Organigram project.
 *
 * The class can be created from raw inputs, a built-in template name, or left
 * blank to start from the default empty template.
 */
export declare class Organigram {
    id: string;
    organs: Organ[];
    assets: Asset[];
    procedures: Procedure[];
    chainId: string;
    slug: string;
    name: string;
    description: string;
    workspaceId?: string | null;
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    constructor(input?: OrganigramInput | keyof typeof templates | string[]);
    editDetails({ name, description }: {
        name?: string;
        description?: string;
        contractAddresses?: string[];
    }): void;
    setOrgans(organs: Organ[]): void;
    setAssets(assets: Asset[]): void;
    setProcedures(procedures: Procedure[]): void;
    /**
     * Hydrate every deployed object referenced by this organigram.
     *
     * @param input Optional viem clients used when the organigram has no attached client yet.
     */
    load: (input?: {
        walletClient?: WalletClient | null;
        publicClient?: PublicClient | null;
    }) => Promise<Organigram>;
    /**
     * Deploy the full organigram through its attached client, then reload it from chain state.
     */
    deploy(): Promise<Organigram>;
    /**
     * Convert the organigram into a JSON-safe structure suitable for persistence or transport.
     */
    toJson: () => OrganigramJson;
}

/**
 * Main SDK entry point used to deploy and hydrate Organigram protocol objects.
 *
 * It keeps a public client, an optional wallet client, the registered
 * procedure types for the current chain, and small in-memory caches for
 * loaded organs, procedures, and assets.
 */
export declare class OrganigramClient {
    address: string;
    chainId: string;
    procedureTypes: ProcedureType[];
    organs: Organ[];
    procedures: Procedure[];
    assets: Asset[];
    cids: File_2[];
    publicClient: PublicClient;
    contract: any;
    walletClient?: WalletClient;
    constructor(input: {
        publicClient: PublicClient;
        address?: string;
        chainId?: string;
        procedureTypes?: ProcedureType[];
        contract?: any;
        walletClient?: WalletClient;
    });
    private getClients;
    /**
     * Deploy a fresh Organigram client contract together with its linked library.
     *
     * @param input Clients used to broadcast deployments and wait for receipts.
     * @returns A ready-to-use SDK instance pointing at the newly deployed client.
     */
    static deployClient(input: {
        publicClient: PublicClient;
        walletClient: WalletClient;
    }): Promise<OrganigramClient>;
    /**
     * Load metadata for one deployed procedure implementation.
     *
     * @param input Address and optional CID used to identify the procedure type.
     * @param publicClient Read-only client used for interface checks.
     */
    static loadProcedureType({ addr, cid }: {
        addr: string;
        cid?: string;
    }, publicClient: PublicClient): Promise<ProcedureType>;
    /**
     * Read the procedure registry and resolve every supported procedure type.
     *
     * @param input Optional client contract address and the public client used to query it.
     */
    static loadProcedureTypes({ address, publicClient }: {
        publicClient: PublicClient;
        address?: string;
    }): Promise<ProcedureType[]>;
    /**
     * Connect the SDK to an already deployed Organigram client contract.
     *
     * @param input Address override plus the viem clients used for reads and writes.
     */
    static load(input: {
        address?: string;
        publicClient: PublicClient;
        walletClient?: WalletClient;
    }): Promise<OrganigramClient>;
    private mapWithConcurrencyLimit;
    /**
     * Infer the registered procedure type of a deployed procedure clone.
     *
     * @param procedureAddress Address of the deployed procedure instance.
     */
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    /**
     * Load one deployed organ and memoize it in the client cache.
     *
     * @param address Organ contract address.
     * @param cached Whether an already hydrated organ can be reused from memory.
     * @param initialOrgan Optional fallback metadata merged into the loaded organ.
     */
    getDeployedOrgan(address: string, cached?: boolean, initialOrgan?: OrganInput): Promise<Organ>;
    /**
     * Load one deployed asset and memoize it in the client cache.
     *
     * @param address Asset contract address.
     * @param cached Whether an already hydrated asset can be reused from memory.
     * @param initialAsset Optional fallback metadata merged into the loaded asset.
     */
    getDeployedAsset(address: string, cached?: boolean, initialAsset?: Asset): Promise<Asset>;
    /**
     * Load one deployed procedure and memoize it in the client cache.
     *
     * @param address Procedure contract address.
     * @param cached Whether an already hydrated procedure can be reused from memory.
     * @param initialProcedure Optional fallback metadata merged into the loaded procedure.
     */
    getDeployedProcedure(address: string, cached?: boolean, initialProcedure?: ProcedureInput): Promise<Procedure>;
    /**
     * Deploy a single organ clone and hydrate the resulting SDK object.
     *
     * When no permissions are provided, the connected wallet is granted the full
     * admin bitmask by default so the organ remains operable after deployment.
     *
     * @param input Optional organ metadata, permissions, entries, and transaction options.
     */
    deployOrgan(input?: DeployOrganInput): Promise<Organ>;
    /**
     * Deploy several organs in one batch transaction.
     *
     * @param deployOrgansInput Organ definitions to deploy.
     */
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    /**
     * Deploy a single ERC-20 asset clone.
     *
     * @param name Token name exposed by the deployed contract.
     * @param symbol Token symbol exposed by the deployed contract.
     * @param initialSupply Human-readable token supply before conversion to wei.
     * @param salt Optional deterministic clone salt.
     * @param options Optional transaction controls.
     * @returns The address of the deployed asset contract.
     */
    deployAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    /**
     * Deploy several assets in one batch transaction.
     *
     * @param assets Assets to deploy.
     * @param options Optional transaction controls.
     * @returns The deployed asset addresses in deployment order.
     */
    deployAssets(assets: DeployAssetInput[], options?: TransactionOptions): Promise<string[]>;
    /**
     * Deploy a single procedure clone from one registered procedure type.
     *
     * @param input Procedure type, role organs, optional metadata, and initialization args.
     */
    deployProcedure(input: DeployProceduresInput): Promise<Procedure>;
    /**
     * Deploy several procedures in one batch transaction.
     *
     * @param deployProceduresInput Procedure definitions to deploy.
     */
    deployProcedures(deployProceduresInput: DeployProceduresInput[]): Promise<Procedure[]>;
    /**
     * Deploy a full organigram, including its organs, assets, and procedures.
     *
     * @param input Batch deployment input for the whole organigram.
     * @returns The deployed organ, asset, and procedure addresses.
     */
    deployOrganigram(input: DeployOrganigramInput): Promise<readonly string[]>;
    /**
     * Attempt to load one deployed contract as an organ or procedure.
     *
     * @param address Contract address to inspect.
     * @param cached Whether cached instances may be reused.
     */
    loadContract(address: string, cached?: boolean): Promise<Organ | Procedure | null>;
    /**
     * Load a heterogeneous list of deployed contract addresses into an organigram.
     *
     * @param contractAddresses Addresses to resolve as organs, procedures, or assets.
     */
    loadContracts(contractAddresses: string[]): Promise<Organigram>;
    /**
     * Hydrate every deployed object referenced by an organigram definition.
     *
     * Undeployed placeholders are preserved as-is, while deployed organs,
     * procedures, and assets are refreshed from chain state.
     *
     * @param organigram Organigram definition to hydrate.
     * @param cached Whether previously cached instances may be reused.
     */
    loadOrganigram(organigram: Organigram, cached?: boolean): Promise<Organigram>;
}

/**
 * Input used to create an in-memory organigram model.
 */
export declare type OrganigramInput = {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    chainId?: string | null;
    organs: OrganInput[];
    procedures: ProcedureInput[];
    assets: AssetInput[];
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};

/**
 * JSON-safe serialized representation of an organigram.
 */
export declare type OrganigramJson = {
    id: string;
    slug: string;
    name: string;
    description: string;
    chainId: string;
    organs: OrganJson[];
    procedures: ProcedureJson[];
    assets: AssetJson[];
    workspaceId?: string | null;
};

export declare type OrganigramTransaction = {
    hash: Hex;
    wait: () => Promise<OrganigramTransactionReceipt>;
};

export declare type OrganigramTransactionReceipt = TransactionReceipt & {
    gasPrice?: bigint | null;
};

export declare interface OrganInput {
    address?: string | null;
    chainId?: string | null;
    publicClient?: PublicClient | null;
    walletClient?: WalletClient | null;
    balance?: string | null;
    cid?: string | null;
    permissions?: OrganPermission[] | null;
    entries?: Array<{
        index: string;
        address: string;
        cid: string;
    }> | null;
    salt?: string | null;
    isDeployed?: boolean | null;
    name?: string | null;
    description?: string | null;
    organigramId?: string | null;
    forwarder?: string | null;
}

/**
 * JSON-safe serialized representation of one organ.
 */
export declare interface OrganJson {
    address: string;
    name: string;
    isDeployed: boolean;
    description: string;
    cid: string;
    entries: OrganEntry[];
    permissions: OrganPermission[];
    salt?: string | null;
    chainId: string;
    organigramId: string;
    balance: string;
}

/**
 * Permission grant applied to a procedure or address on an organ.
 */
export declare interface OrganPermission {
    permissionAddress: string;
    permissionValue: number;
}

export declare const PERMISSIONS: {
    ADMIN: number;
    ALL: number;
    ALL_PERMISSIONS: number;
    ALL_ENTRIES: number;
    ADD_PERMISSIONS: number;
    REMOVE_PERMISSIONS: number;
    ADD_ENTRIES: number;
    REMOVE_ENTRIES: number;
    UPDATE_METADATA: number;
    DEPOSIT_ETHER: number;
    WITHDRAW_ETHER: number;
    DEPOSIT_COINS: number;
    WITHDRAW_COINS: number;
    DEPOSIT_COLLECTIBLES: number;
    WITHDRAW_COLLECTIBLES: number;
    EXECUTE_WHITELISTED: number;
    MANAGE_EXECUTION_WHITELIST: number;
};

export declare type PopulatedTransactionData = {
    data: string;
};

export declare interface PopulateInitializeInput {
    options?: TransactionOptions;
    typeName?: ProcedureTypeName;
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    forwarder: string;
    args: unknown[];
}

export declare const populateInitializeProcedure: (input: PopulateInitializeInput, clients: ContractClients) => Promise<PopulatedTransactionData>;

export declare const predictContractAddress: ({ type, chainId, salt }: {
    type: Omit<ContractName, "OrganigramClient">;
    chainId: string;
    salt: string;
}) => string;

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

export declare const prepareDeployProceduresInput: (deployProceduresInput: DeployProceduresInput[], clients: ContractClients) => Promise<{
    procedureType: string;
    data: string;
    salt: string;
    options: TransactionOptions | undefined;
}[]>;

/**
 * Base SDK model shared by every procedure implementation.
 */
export declare class Procedure {
    static INTERFACE: string;
    static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[];
    name: string;
    description: string;
    address: string;
    typeName: ProcedureTypeName;
    cid: string;
    isDeployed: boolean;
    deciders: string;
    proposers: string;
    withModeration: boolean;
    moderators: string;
    metadata: string;
    data: string;
    forwarder: string;
    proposals: ProcedureProposal[];
    contract?: any;
    salt?: string;
    chainId: string;
    walletClient?: WalletClient;
    publicClient?: PublicClient;
    organigramId: string;
    type: ProcedureType;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, publicClient, walletClient, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId }: ProcedureInput);
    protected getClients(): ContractClients;
    static _populateInitialize(_populateInitializeInput: PopulateInitializeInput, _clients: ContractClients): Promise<PopulatedTransactionData>;
    static loadData(address: string, clients: ContractClients): Promise<ProcedureContractData>;
    static loadProposal(address: string, proposalKey: string, clients: ContractClients): Promise<ProcedureProposal>;
    static loadProposals(address: string, clients: ContractClients, data?: ProcedureContractData): Promise<ProcedureProposal[]>;
    static load(address: string, clients: ContractClients, initialProcedure?: ProcedureInput): Promise<Procedure>;
    static _stringifyParamType(type: OperationParamType): string;
    static _extractParams(types: OperationParamType[], operation?: ProcedureProposalOperation): OperationParam[];
    static parseOperation(rawOperation: unknown): ProcedureProposalOperation;
    static isProcedure(address: string, clients: ContractClients): Promise<boolean>;
    updateCid(cid: string, options?: TransactionOptions): Promise<OrganigramTransaction>;
    updateAdmin(address: string, options?: TransactionOptions): Promise<OrganigramTransaction>;
    propose(input: {
        cid: string;
        operations: ProcedureProposalOperation[];
        options?: TransactionOptions;
    }): Promise<ProcedureProposal>;
    signProposal(input: SignedProposalInput): Promise<string>;
    signPresentProposal(input: SignedProposalActionInput): Promise<string>;
    signBlockProposal(input: SignedBlockProposalInput): Promise<string>;
    signApplyProposal(input: SignedProposalActionInput): Promise<string>;
    proposeBySig(input: SignedProposalInput & {
        signature: string;
    }): Promise<OrganigramTransaction>;
    getNonce(account: string): Promise<bigint>;
    getTypedDataDomain(): {
        name: string;
        version: string;
        chainId: bigint;
        verifyingContract: `0x${string}`;
    };
    static createExternalCallOperation({ organAddress, target, data, value, index }: ExternalCallOperationInput): ProcedureProposalOperation;
    blockProposal(proposalKey: string, reason: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    blockProposalBySig(input: SignedBlockProposalInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    presentProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    presentProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    applyProposal(proposalKey: string, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    applyProposalBySig(input: SignedProposalActionInput & {
        signature: string;
    }, options?: TransactionOptions): Promise<OrganigramTransactionReceipt>;
    reloadProposals(): Promise<Procedure>;
    reloadProposal(proposalKey: string): Promise<Procedure>;
    reloadData(): Promise<Procedure>;
    toJson: () => ProcedureJson;
}

declare type ProcedureContractData = {
    cid: string;
    proposers: string;
    moderators: string;
    deciders: string;
    withModeration: boolean;
    proposalsLength: bigint;
    interfaceId?: string;
};

export declare const procedureFunctions: ProcedureProposalOperationFunction[];

/**
 * Input used to create or hydrate a procedure model.
 */
export declare interface ProcedureInput {
    address?: string | null;
    deciders: string;
    typeName: string;
    type?: ProcedureType;
    name?: string | null;
    description?: string | null;
    salt?: string | null;
    chainId?: string | null;
    cid?: string | null;
    publicClient?: PublicClient | null;
    walletClient?: WalletClient | null;
    metadata?: string | null;
    proposers?: string | null;
    withModeration?: boolean | null;
    moderators?: string | null;
    forwarder?: string | null;
    proposals?: ProcedureProposal[] | null;
    isDeployed?: boolean | null;
    organigramId?: string | null;
    data?: string | null;
}

/**
 * JSON-safe serialized representation of one procedure.
 */
export declare type ProcedureJson = {
    isDeployed: boolean;
    address: string;
    deciders: string;
    typeName: ProcedureTypeName;
    name: string;
    description: string;
    cid: string;
    salt?: string | null;
    chainId: string;
    data: string;
    metadata?: string;
    proposers: string;
    moderators: string;
    withModeration: boolean;
    forwarder: string;
    proposals?: ProcedureProposal[];
    args?: unknown[];
    type: ProcedureType;
    organigramId?: string | null;
};

export declare const procedureMetadata: {
    _type: string;
    _generator: string;
    _generatedAt: number;
};

/**
 * Hydrated proposal state exposed by the SDK.
 */
export declare interface ProcedureProposal {
    key: ProposalKey;
    creator: string;
    cid: string;
    blockReason: string;
    presented: boolean;
    blocked: boolean;
    adopted: boolean;
    applied: boolean;
    operations: ProcedureProposalOperation[];
    metadata?: ProposalMetadata;
}

/**
 * One low-level operation bundled into a proposal.
 */
export declare interface ProcedureProposalOperation {
    index: string;
    functionSelector: string;
    target?: string;
    data: string;
    value?: string;
    processed?: boolean;
    function?: ProcedureProposalOperationFunction;
    params?: OperationParam[];
    userIsInOrgan?: boolean;
    userIsInEntry?: boolean;
    description?: string;
}

export declare interface ProcedureProposalOperationFunction {
    funcSig: string;
    key: ProposalKey;
    signature?: string;
    label?: string;
    tags?: OperationTag[];
    params?: OperationParamType[];
    abi?: unknown;
    target?: 'organ' | 'self';
}

/**
 * Named organ roles used by procedure access control.
 */
export declare type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders';

/**
 * Human-readable labels for the procedure role slots expected by the protocol.
 */
export declare const procedureRoleTypes: {
    label: string;
    name: string;
}[];

/**
 * Metadata describing one registered procedure implementation.
 */
export declare interface ProcedureType {
    key: string;
    address: string;
    metadata: {
        cid?: string;
        label?: string;
        description?: string;
    };
    fields?: {
        [key: string]: ProcedureTypeField;
    };
}

/**
 * Declarative description of one procedure configuration field.
 */
export declare interface ProcedureTypeField {
    name: string;
    label: string;
    description: string;
    defaultValue: string;
    type: any;
}

export declare type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote';

export declare enum ProcedureTypeNameEnum {
    erc20Vote = "erc20Vote",
    nomination = "nomination",
    vote = "vote"
}

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
        fields: {};
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

export declare type ProposalKey = 'addEntries' | 'removeEntries' | 'replaceEntry' | 'addPermission' | 'removePermission' | 'replacePermission' | 'updateMetadata' | 'transfer' | 'externalCall' | string;

/**
 * Rich content attached to a proposal, usually stored off-chain.
 */
export declare interface ProposalMetadata {
    title: string;
    subtitle?: string;
    description?: string;
    discussion?: string;
    file?: string;
    cid?: string;
}

declare type ProtocolDeploymentName = 'Asset' | 'Organ' | 'ERC20VoteProcedure' | 'NominationProcedure' | 'VoteProcedure' | 'MetaGasStation' | 'OrganigramClient' | 'CloneableOrgan' | 'CloneableAsset';

declare type ProtocolDeployments = Record<string, Record<ProtocolDeploymentName, string>>;

export declare const renewSaltsAndAddresses: (organigram: OrganigramInput, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        isDeployed: boolean;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        publicClient?: PublicClient | null;
        walletClient?: WalletClient | null;
        balance?: string | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        name?: string | null;
        description?: string | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        data: string;
        isDeployed: boolean;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        publicClient?: PublicClient | null;
        walletClient?: WalletClient | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: ProcedureProposal[] | null;
        organigramId?: string | null;
    }[];
    assets: {
        chainId: string;
        isDeployed: boolean;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        symbol?: string | null;
        initialSupply?: number | null;
        image?: string | null;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: OrganigramClient | null;
    walletClient?: WalletClient | null;
    publicClient?: PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};

export declare interface SignedBlockProposalInput extends SignedProposalActionInput {
    reason: string;
}

export declare interface SignedProposalActionInput {
    proposalKey: string;
    nonce: bigint;
    deadline: bigint | number;
}

export declare interface SignedProposalInput {
    cid: string;
    operations: ProcedureProposalOperation[];
    nonce: bigint;
    deadline: bigint | number;
}

export declare type TemplateName = keyof typeof templates;

export declare const templates: {
    none: {
        name: string;
        organs: {
            salt: string;
            address: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            data: string;
            deciders: string;
            proposers: string;
        }[];
        assets: never[];
    };
    forProfit: {
        name: string;
        organs: {
            salt: string;
            address: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            data: string;
            deciders: string;
            proposers: string;
        }[];
        assets: {
            salt: string;
            address: string;
            name: string;
            symbol: string;
        }[];
    };
    nonProfit: {
        name: string;
        organs: {
            salt: string;
            address: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: ({
            salt: string;
            address: string;
            name: string;
            typeName: string;
            data: string;
            deciders: string;
            proposers: string;
        } | {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            data?: undefined;
        })[];
        assets: {
            salt: string;
            address: string;
            name: string;
            symbol: string;
        }[];
    };
    openSource: {
        name: string;
        organs: {
            salt: string;
            address: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
        }[];
        assets: never[];
    };
    participatoryBudget: {
        name: string;
        organs: {
            name: string;
            address: string;
            salt: string;
            entries: never[];
            permissions: {
                permissionValue: number;
                permissionAddress: string;
            }[];
        }[];
        assets: never[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            data: string;
        }[];
    };
};

/**
 * Optional transaction-level controls shared by write operations.
 */
export declare interface TransactionOptions {
    nonce?: number;
    customData?: {
        index?: number;
    };
    onTransaction?: (tx: OrganigramTransaction, description: string) => void;
}

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

export declare type VoteProcedureInput = ProcedureInput & {
    quorumSize: string;
    voteDuration: string;
    majoritySize: string;
    elections: Election[];
};

export { }
