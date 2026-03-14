import { ethers } from 'ethers';
export declare const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export type MulticallRequest<T> = {
    target: string;
    allowFailure?: boolean;
    callData: string;
    decode: (returnData: string) => T;
};
export declare const getProviderFromSignerOrProvider: (signerOrProvider?: ethers.Signer | ethers.Provider | null) => ethers.Provider | null;
export declare const tryMulticall: <T>(signerOrProvider: ethers.Signer | ethers.Provider, requests: MulticallRequest<T>[]) => Promise<Array<T | null> | null>;
