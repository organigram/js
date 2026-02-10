import { type Contract as EthersContract, type Signer } from 'ethers';
import { SourceOrgan } from './organigram';
import { Contract } from 'ethers';
export declare const ERC20_INITIAL_SUPPLY = 10000000;
export interface AssetJson {
    address: string;
    isDeployed: boolean;
    name: string;
    symbol: string;
    totalSupply: string;
    chainId: string;
    salt?: string | null;
    image?: string | null;
    isSourceOrgan: SourceOrgan[];
    userBalance: string;
}
export interface AssetInput {
    name?: string | null;
    description?: string | null;
    address?: string | null;
    contract?: EthersContract | null;
    symbol?: string | null;
    totalSupply?: string | null;
    chainId?: string | null;
    salt?: string | null;
    isSourceOrgan?: SourceOrgan[];
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
    totalSupply: string;
    chainId: string;
    salt?: string | null;
    isSourceOrgan: SourceOrgan[];
    image?: string | null;
    isDeployed: boolean;
    userBalance: string;
    constructor(input: AssetInput);
    load: (signer?: Signer | null) => Promise<(Asset & {
        userBalance: string;
    }) | undefined>;
    deploy: (signer?: Signer | null) => Promise<Contract>;
    toJson(): AssetJson;
}
