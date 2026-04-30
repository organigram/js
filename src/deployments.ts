import type { Chain } from 'viem'
import * as chains from 'viem/chains'
import { sepolia } from 'viem/chains'
import rawDeployedAddresses from '@organigram/protocol/deployments.json' with { type: 'json' }

export type ProtocolDeploymentName =
  | 'Asset'
  | 'Organ'
  | 'ERC20VoteProcedure'
  | 'NominationProcedure'
  | 'VoteProcedure'
  | 'MetaGasStation'
  | 'OrganigramClient'
  | 'CloneableOrgan'
  | 'CloneableAsset'

export type ProtocolDeployments = Record<
  string,
  Record<ProtocolDeploymentName, string>
>

const deployedAddresses: ProtocolDeployments = rawDeployedAddresses

const localHostnames = new Set(['localhost', '127.0.0.1'])
const anvilChainId = '31337'
const sepoliaChainId = sepolia.id.toString()
const localChainProviderUrl = 'http://127.0.0.1:8545'

const createUrl = (hostUrl?: string): URL | null => {
  if (hostUrl == null || hostUrl === '') return null

  try {
    return new URL(hostUrl)
  } catch {
    try {
      return new URL(`https://${hostUrl}`)
    } catch {
      return null
    }
  }
}

const getProcessEnv = (key: string): string | undefined =>
  typeof process === 'undefined' ? undefined : process.env?.[key]

export const getHostUrl = (
  hostUrl = getProcessEnv('NEXT_PUBLIC_HOST_URL')
): URL | null =>
  createUrl(hostUrl) ??
  (typeof window !== 'undefined' ? createUrl(window.location.origin) : null)

export const isLocalHost = (hostUrl?: string): boolean =>
  localHostnames.has(getHostUrl(hostUrl)?.hostname ?? '')

const normalizeChainId = (
  chainId: string | number | bigint | null | undefined
): string => (chainId == null ? '' : chainId.toString())

export const getSupportedChainIds = (): string[] => Object.keys(deployedAddresses)

export const isSupportedChainId = (
  chainId: string | number | bigint | null | undefined
): boolean => {
  const normalizedChainId = normalizeChainId(chainId)
  return normalizedChainId !== '' && deployedAddresses[normalizedChainId] != null
}

export const resolveDeployment = (
  chainId: string | number | bigint | null | undefined,
  deploymentName: ProtocolDeploymentName
): string | undefined => {
  const normalizedChainId = normalizeChainId(chainId)
  if (normalizedChainId === '') return undefined
  return deployedAddresses[normalizedChainId]?.[deploymentName]
}

export const getDeployment = (
  chainId: string | number | bigint | null | undefined,
  deploymentName: ProtocolDeploymentName
): string => {
  const deployment = resolveDeployment(chainId, deploymentName)
  if (deployment == null) {
    const normalizedChainId = normalizeChainId(chainId)
    throw new Error(
      `Missing ${deploymentName} deployment for chain ${normalizedChainId || 'unknown'}.`
    )
  }
  return deployment
}

const getChainById = (chainId: string): Chain | undefined =>
  Object.values(chains).find(chain => {
    const candidate = chain as Partial<Chain>
    return (
      typeof candidate.id === 'number' && candidate.id.toString() === chainId
    )
  }) as Chain | undefined

const createLocalChainFork = (chain: Chain): Chain => ({
  ...chain,
  name: `Local ${chain.name} Fork`,
  rpcUrls: {
    ...chain.rpcUrls,
    default: {
      ...chain.rpcUrls.default,
      http: [localChainProviderUrl]
    },
    public:
      chain.rpcUrls.public == null
        ? chain.rpcUrls.public
        : {
            ...chain.rpcUrls.public,
            http: [localChainProviderUrl]
          }
  },
  // Keep receipt/block polling aggressive on localhost-backed forks.
  blockTime: 1_000
})

const sortSupportedChainIds = (chainIds: string[]): string[] =>
  [...chainIds].sort((a, b) => {
    if (a === sepolia.id.toString()) return 1
    if (b === sepolia.id.toString()) return -1
    return Number(a) - Number(b)
  })

export const getConfiguredChain = (
  chainId: string,
  hostUrl?: string,
  preferLocalHost = true
): Chain | undefined => {
  const chain = chainId === sepoliaChainId ? sepolia : getChainById(chainId)
  if (chain == null) return undefined

  return isLocalHost(hostUrl) &&
    preferLocalHost &&
    chainId === sepoliaChainId &&
    !isSupportedChainId(anvilChainId)
    ? createLocalChainFork(chain)
    : chain
}

export const getSupportedChains = (
  hostUrl?: string,
  preferLocalHost = true
): Chain[] =>
  sortSupportedChainIds(getSupportedChainIds())
    .map(chainId => getConfiguredChain(chainId, hostUrl, preferLocalHost))
    .filter((chain): chain is Chain => chain != null)

export const getChainExplorerBaseUrl = (
  chainId: string
): string | undefined => getConfiguredChain(chainId)?.blockExplorers?.default.url

const isProductionRuntime = (): boolean => {
  const nodeEnv = getProcessEnv('NODE_ENV')
  if (nodeEnv != null) return nodeEnv === 'production'
  return typeof window !== 'undefined' && !isLocalHost()
}

export const getDefaultChainId = (): string => {
  // Prefer Mainnet in production, but fall back to the first deployed chain
  // until the mainnet deployment is actually present in deployments.json.
  return isLocalHost() || !isProductionRuntime()
    ? isSupportedChainId(anvilChainId)
      ? anvilChainId
      : sepoliaChainId
    : isSupportedChainId('1')
      ? '1'
      : getSupportedChainIds()[0] ?? sepoliaChainId
}

export default deployedAddresses
