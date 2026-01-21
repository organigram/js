import { type BaseContract, type Contract as EthersContract, type Signer } from 'ethers';
export interface Asset {
    contract: EthersContract;
    name: string;
    symbol: string;
    totalSupply: string;
    userBalance: string;
}
export declare const getAssetData: (assetAddress?: string | null, signer?: Signer | null) => Promise<Asset | undefined>;
export declare const deployERC20: (signer?: Signer | null) => Promise<BaseContract & Omit<BaseContract, keyof BaseContract>>;
