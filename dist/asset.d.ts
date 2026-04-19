import { type ContractClients } from './contracts';
export declare const ERC20_INITIAL_SUPPLY = 10000000;
/**
 * JSON-safe serialized representation of one asset.
 */
export interface AssetJson {
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
/**
 * Input used to create or hydrate an asset model.
 */
export interface AssetInput {
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
