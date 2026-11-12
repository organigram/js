import { type PublicClient } from 'viem';
import type { DeployOrganigramInput } from './organigramClient';
type DeployedOrganigramAddresses = {
    organs: string[];
    assets: string[];
    procedures: string[];
};
/** The input is copied with its new addresses: class instances come back as plain objects. */
export type DeployOrganigramResult = readonly [
    organs: string[],
    assets: string[],
    procedures: string[]
] & {
    organigram: DeployOrganigramInput;
};
export declare const createDeployOrganigramResult: (addresses: DeployedOrganigramAddresses, organigram: DeployOrganigramInput) => DeployOrganigramResult;
export declare const refreshUndeployedContractReferences: <Input extends DeployOrganigramInput>(input: Input, chainId: string, deployer: string) => Input;
export declare const applyDeployedOrganigramAddresses: <Input extends DeployOrganigramInput>(input: Input, deployedAddresses: DeployedOrganigramAddresses, refreshedInput?: DeployOrganigramInput) => Input;
export declare const markExistingOrganigramDeployments: <Input extends DeployOrganigramInput>(input: Input, publicClient: PublicClient) => Promise<Input>;
export {};
