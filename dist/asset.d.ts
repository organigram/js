import { type ContractClients } from './contracts';
export declare const ERC20_INITIAL_SUPPLY = 10000000;
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
    static load: (address: string, clients: ContractClients, initialAsset?: AssetInput) => Promise<(Asset & {
        userBalance: string;
    }) | undefined>;
    toJson(): AssetJson;
}
