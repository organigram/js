import type { Chain } from 'viem';
export type ProtocolDeploymentName = 'Asset' | 'EquityToken' | 'Organ' | 'ERC20VoteProcedure' | 'NominationProcedure' | 'VoteProcedure' | 'MetaGasStation' | 'OrganigramClient' | 'CloneableOrgan' | 'CloneableAsset';
export type ProtocolDeployments = Record<string, Partial<Record<ProtocolDeploymentName, string>>>;
/** Addresses of the protocol contracts on each supported chain, by chain id. */
declare const deployedAddresses: ProtocolDeployments;
/**
 * URL of the Organigram app: `NEXT_PUBLIC_HOST_URL`, or the current page origin in a browser.
 */
export declare const getHostUrl: (hostUrl?: string | undefined) => URL | null;
/** Tell whether the app runs on a local host name. */
export declare const isLocalHost: (hostUrl?: string) => boolean;
/** List the chains the protocol is deployed on. */
export declare const getSupportedChainIds: () => string[];
/** Tell whether the protocol is deployed on a chain. */
export declare const isSupportedChainId: (chainId: string | number | bigint | null | undefined) => boolean;
export declare const resolveDeployment: (chainId: string | number | bigint | null | undefined, deploymentName: ProtocolDeploymentName) => string | undefined;
/**
 * Return the address of a protocol contract on a chain, and throw if it is not deployed there.
 */
export declare const getDeployment: (chainId: string | number | bigint | null | undefined, deploymentName: ProtocolDeploymentName) => string;
/** Return the viem chain definition of a chain id. */
export declare const getConfiguredChain: (chainId: string) => Chain | undefined;
export declare const getSupportedChains: () => Chain[];
/** Return the block explorer URL of a chain. */
export declare const getChainExplorerBaseUrl: (chainId: string) => string | undefined;
/**
 * Default network: Anvil when local deployments are loaded, Ethereum mainnet
 * otherwise. Pass a chain id explicitly to use any other network.
 *
 * @returns The default chain id.
 */
export declare const getDefaultChainId: () => string;
export default deployedAddresses;
