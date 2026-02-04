import { type BaseContract, type Contract as EthersContract, type Signer } from 'ethers';
import { SourceOrgan } from './organigram';
export declare const ERC20_INITIAL_SUPPLY = 10000000;
export interface AssetJson {
    address: string;
    name?: string;
    symbol?: string;
    totalSupply?: string;
    chainId?: string;
    salt?: string;
}
export interface Asset {
    address: string;
    name: string;
    contract: EthersContract;
    symbol: string;
    totalSupply: string;
    chainId: string;
    salt?: string;
    isSourceOrgan?: SourceOrgan[];
}
export declare const getAssetData: (assetAddress: string, signer?: Signer | null) => Promise<(Asset & {
    userBalance: string;
}) | undefined>;
export declare const deployERC20: (signer?: Signer | null) => Promise<BaseContract & Omit<BaseContract, keyof BaseContract>>;
