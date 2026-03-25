import { type Hex } from 'viem';
import { type ContractClients } from './contracts';
export declare const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
export type MulticallRequest<T> = {
    target: string;
    allowFailure?: boolean;
    callData: string;
    decode: (returnData: Hex) => T;
};
export declare const tryMulticall: <T>(clients: ContractClients, requests: MulticallRequest<T>[]) => Promise<Array<T | null> | null>;
