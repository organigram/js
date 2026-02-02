import { type BaseContract, type Contract as EthersContract, type Signer } from 'ethers';
export declare const ERC20_INITIAL_SUPPLY = 10000000;
export interface Asset {
    contract: EthersContract;
    name: string;
    symbol: string;
    totalSupply: string;
}
export declare const getAssetData: (assetAddress?: string | null, signer?: Signer | null) => Promise<(Asset & {
    userBalance: string;
}) | undefined>;
export declare const deployERC20: (signer?: Signer | null) => Promise<BaseContract & Omit<BaseContract, keyof BaseContract>>;
