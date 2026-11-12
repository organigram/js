import { type ContractClients } from './contracts';
/** Default supply minted for a new asset, in whole tokens. */
export declare const ERC20_INITIAL_SUPPLY = 10000000;
/** An asset as plain JSON, to store or send it. */
export interface AssetJson {
    /** Contract address, or a predicted address while it is a draft. */
    address: string;
    /** Whether the contract exists on chain. */
    isDeployed: boolean;
    /** Token name. */
    name: string;
    /** Token symbol. */
    symbol: string;
    /** Supply minted at deployment, in whole tokens. */
    initialSupply: number;
    /** Chain the asset lives on. */
    chainId: string;
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Logo URL. */
    image?: string | null;
    /** Balance of the connected wallet, in the smallest unit. */
    userBalance: string;
    /**
     * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
     */
    kind: 'asset' | 'equity';
    /** Procedure authorized to settle this equity token's transfers. */
    decisionProcedure?: string | null;
    /** Organigram the asset belongs to. */
    organigramId?: string | null;
}
/** The data of an asset, deployed or still a draft. */
export interface AssetInput {
    /** Token name. */
    name?: string | null;
    /** Free description. */
    description?: string | null;
    /** Contract address, or a predicted address while it is a draft. */
    address?: string | null;
    /** Token symbol. */
    symbol?: string | null;
    /** Supply minted at deployment, in whole tokens. */
    initialSupply?: number | null;
    /** Chain the asset lives on. */
    chainId?: string | null;
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Logo URL. */
    image?: string | null;
    /** Whether the contract exists on chain. */
    isDeployed?: boolean;
    /** Balance of the connected wallet, in the smallest unit. */
    userBalance?: string | null;
    /** Organigram the asset belongs to. */
    organigramId?: string | null;
    /**
     * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
     */
    kind?: 'asset' | 'equity' | null;
    /** Procedure authorized to settle this equity token's transfers. */
    decisionProcedure?: string | null;
}
/** An ERC-20 token held by organs: a plain asset or company equity. */
export declare class Asset {
    /** Contract address, or a predicted address while it is a draft. */
    address: string;
    /** Token name. */
    name: string;
    /** Free description. */
    description: string;
    /** Token symbol. */
    symbol: string;
    /** Supply minted at deployment, in whole tokens. */
    initialSupply: number;
    /** Chain the asset lives on. */
    chainId: string;
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Logo URL. */
    image?: string | null;
    /** Whether the contract exists on chain. */
    isDeployed: boolean;
    /** Balance of the connected wallet, in the smallest unit. */
    userBalance: string;
    /** Organigram the asset belongs to. */
    organigramId?: string | null;
    /**
     * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
     */
    kind: 'asset' | 'equity';
    /** Procedure that approves transfers of this equity token. */
    decisionProcedure?: string | null;
    constructor(input: AssetInput);
    /**
     * Hydrate an asset from chain state.
     *
     * @param address - Asset contract address.
     * @param clients - viem clients used to query the contract.
     * @param initialAsset - Optional fallback metadata merged into the loaded asset.
     */
    static load: (address: string, clients: ContractClients, initialAsset?: AssetInput) => Promise<(Asset & {
        userBalance: string;
    }) | undefined>;
    /**
     * Convert the asset into a JSON-safe structure.
     */
    toJson(): AssetJson;
}
