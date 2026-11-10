import type { Chain } from 'viem'
import { isAddress } from 'viem'
import * as chains from 'viem/chains'
import { sepolia } from 'viem/chains'
import rawDeployedAddresses from '@organigram/protocol/deployments.json' with { type: 'json' }

export type ProtocolDeploymentName =
  | 'Asset'
  | 'EquityToken'
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
  Partial<Record<ProtocolDeploymentName, string>>
>

/** Addresses of the protocol contracts on each supported chain, by chain id. */
const deployedAddresses: ProtocolDeployments = rawDeployedAddresses

const localHostnames = new Set(['localhost', '127.0.0.1'])
const anvilChainId = '31337'
const mainnetChainId = '1'
const sepoliaChainId = sepolia.id.toString()

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

const parseLocalDeployments = (): ProtocolDeployments => {
  try {
    const rawDeployments =
      typeof process === 'undefined'
        ? undefined
        : process.env.NEXT_PUBLIC_LOCAL_PROTOCOL_DEPLOYMENTS
    return JSON.parse(rawDeployments ?? '{}') as ProtocolDeployments
  } catch {
    return {}
  }
}

Object.assign(deployedAddresses, parseLocalDeployments())

/**
 * URL of the Organigram app: `NEXT_PUBLIC_HOST_URL`, or the current page origin in a browser.
 */
export const getHostUrl = (
  hostUrl = getProcessEnv('NEXT_PUBLIC_HOST_URL')
): URL | null =>
  createUrl(hostUrl) ??
  (typeof window !== 'undefined' ? createUrl(window.location.origin) : null)

/** Tell whether the app runs on a local host name. */
export const isLocalHost = (hostUrl?: string): boolean =>
  localHostnames.has(getHostUrl(hostUrl)?.hostname ?? '')

const normalizeChainId = (
  chainId: string | number | bigint | null | undefined
): string => (chainId == null ? '' : chainId.toString())

/** List the chains the protocol is deployed on. */
export const getSupportedChainIds = (): string[] =>
  Object.keys(deployedAddresses)

/** Tell whether the protocol is deployed on a chain. */
export const isSupportedChainId = (
  chainId: string | number | bigint | null | undefined
): boolean => {
  const normalizedChainId = normalizeChainId(chainId)
  return (
    normalizedChainId !== '' && deployedAddresses[normalizedChainId] != null
  )
}

export const resolveDeployment = (
  chainId: string | number | bigint | null | undefined,
  deploymentName: ProtocolDeploymentName
): string | undefined => {
  const normalizedChainId = normalizeChainId(chainId)
  if (normalizedChainId === '') return undefined
  const deployment = deployedAddresses[normalizedChainId]?.[deploymentName]
  if (deployment == null || deployment.trim() === '') return undefined
  return deployment
}

/**
 * Return the address of a protocol contract on a chain, and throw if it is not deployed there.
 */
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
  if (!isAddress(deployment)) {
    const normalizedChainId = normalizeChainId(chainId)
    throw new Error(
      `Invalid ${deploymentName} deployment for chain ${normalizedChainId || 'unknown'}: ${deployment}.`
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

const sortSupportedChainIds = (chainIds: string[]): string[] =>
  [...chainIds].sort((a, b) => {
    if (a === sepolia.id.toString()) return 1
    if (b === sepolia.id.toString()) return -1
    return Number(a) - Number(b)
  })

/** Return the viem chain definition of a chain id. */
export const getConfiguredChain = (chainId: string): Chain | undefined => {
  const chain = chainId === sepoliaChainId ? sepolia : getChainById(chainId)
  if (chain == null) return undefined

  return chain
}

export const getSupportedChains = (): Chain[] => {
  return sortSupportedChainIds(getSupportedChainIds())
    .map(chainId => getConfiguredChain(chainId))
    .filter((chain): chain is Chain => chain != null)
}

/** Return the block explorer URL of a chain. */
export const getChainExplorerBaseUrl = (chainId: string): string | undefined =>
  getConfiguredChain(chainId)?.blockExplorers?.default.url

/**
 * Default network: Anvil when local deployments are loaded, Ethereum mainnet
 * otherwise. Pass a chain id explicitly to use any other network.
 *
 * @returns The default chain id.
 */
export const getDefaultChainId = (): string =>
  isSupportedChainId(anvilChainId) ? anvilChainId : mainnetChainId

export default deployedAddresses
