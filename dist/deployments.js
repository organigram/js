import { isAddress } from 'viem';
import * as chains from 'viem/chains';
import { sepolia } from 'viem/chains';
import rawDeployedAddresses from '@organigram/protocol/deployments.json' with { type: 'json' };
const deployedAddresses = rawDeployedAddresses;
const localHostnames = new Set(['localhost', '127.0.0.1']);
const anvilChainId = '31337';
const mainnetChainId = '1';
const sepoliaChainId = sepolia.id.toString();
const createUrl = (hostUrl) => {
    if (hostUrl == null || hostUrl === '')
        return null;
    try {
        return new URL(hostUrl);
    }
    catch {
        try {
            return new URL(`https://${hostUrl}`);
        }
        catch {
            return null;
        }
    }
};
const getProcessEnv = (key) => typeof process === 'undefined' ? undefined : process.env?.[key];
const parseLocalDeployments = () => {
    try {
        const rawDeployments = typeof process === 'undefined'
            ? undefined
            : process.env.NEXT_PUBLIC_LOCAL_PROTOCOL_DEPLOYMENTS;
        return JSON.parse(rawDeployments ?? '{}');
    }
    catch {
        return {};
    }
};
Object.assign(deployedAddresses, parseLocalDeployments());
export const getHostUrl = (hostUrl = getProcessEnv('NEXT_PUBLIC_HOST_URL')) => createUrl(hostUrl) ??
    (typeof window !== 'undefined' ? createUrl(window.location.origin) : null);
export const isLocalHost = (hostUrl) => localHostnames.has(getHostUrl(hostUrl)?.hostname ?? '');
const normalizeChainId = (chainId) => (chainId == null ? '' : chainId.toString());
export const getSupportedChainIds = () => Object.keys(deployedAddresses);
export const isSupportedChainId = (chainId) => {
    const normalizedChainId = normalizeChainId(chainId);
    return (normalizedChainId !== '' && deployedAddresses[normalizedChainId] != null);
};
export const resolveDeployment = (chainId, deploymentName) => {
    const normalizedChainId = normalizeChainId(chainId);
    if (normalizedChainId === '')
        return undefined;
    const deployment = deployedAddresses[normalizedChainId]?.[deploymentName];
    if (deployment == null || deployment.trim() === '')
        return undefined;
    return deployment;
};
export const getDeployment = (chainId, deploymentName) => {
    const deployment = resolveDeployment(chainId, deploymentName);
    if (deployment == null) {
        const normalizedChainId = normalizeChainId(chainId);
        throw new Error(`Missing ${deploymentName} deployment for chain ${normalizedChainId || 'unknown'}.`);
    }
    if (!isAddress(deployment)) {
        const normalizedChainId = normalizeChainId(chainId);
        throw new Error(`Invalid ${deploymentName} deployment for chain ${normalizedChainId || 'unknown'}: ${deployment}.`);
    }
    return deployment;
};
const getChainById = (chainId) => Object.values(chains).find(chain => {
    const candidate = chain;
    return (typeof candidate.id === 'number' && candidate.id.toString() === chainId);
});
const sortSupportedChainIds = (chainIds) => [...chainIds].sort((a, b) => {
    if (a === sepolia.id.toString())
        return 1;
    if (b === sepolia.id.toString())
        return -1;
    return Number(a) - Number(b);
});
export const getConfiguredChain = (chainId) => {
    const chain = chainId === sepoliaChainId ? sepolia : getChainById(chainId);
    if (chain == null)
        return undefined;
    return chain;
};
export const getSupportedChains = () => {
    return sortSupportedChainIds(getSupportedChainIds())
        .map(chainId => getConfiguredChain(chainId))
        .filter((chain) => chain != null);
};
export const getChainExplorerBaseUrl = (chainId) => getConfiguredChain(chainId)?.blockExplorers?.default.url;
/**
 * Default network: Anvil when local deployments are loaded, Ethereum mainnet
 * otherwise. Pass a chain id explicitly to use any other network.
 *
 * @returns The default chain id.
 */
export const getDefaultChainId = () => isSupportedChainId(anvilChainId) ? anvilChainId : mainnetChainId;
export default deployedAddresses;
