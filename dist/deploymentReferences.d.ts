import { type PublicClient } from 'viem';
import type { DeployOrganigramInput } from './organigramClient';
type DeployedOrganigramAddresses = {
    organs: string[];
    assets: string[];
    procedures: string[];
};
export type DeployOrganigramResult<Input extends DeployOrganigramInput = DeployOrganigramInput> = readonly [organs: string[], assets: string[], procedures: string[]] & {
    organigram: Input;
};
export declare const createDeployOrganigramResult: <Input extends DeployOrganigramInput>(addresses: DeployedOrganigramAddresses, organigram: Input) => DeployOrganigramResult<Input>;
export declare const refreshUndeployedContractReferences: <Input extends DeployOrganigramInput>(input: Input, chainId: string) => Input;
export declare const applyDeployedOrganigramAddresses: <Input extends DeployOrganigramInput>(input: Input, deployedAddresses: DeployedOrganigramAddresses, refreshedInput?: DeployOrganigramInput) => Input;
export declare const markExistingOrganigramDeployments: <Input extends DeployOrganigramInput>(input: Input, publicClient: PublicClient) => Promise<Input>;
export {};
