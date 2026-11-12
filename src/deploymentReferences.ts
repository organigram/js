import { isAddress, type PublicClient } from 'viem'
import { type ContractName, predictContractAddress } from './utils'
import { type ProcedureTypeName } from './procedure/utils'
import type { DeployOrganigramInput } from './organigramClient'

type MaybeAddressed = {
  address?: string | null
  salt?: string | null
  isDeployed?: boolean | null
}

type DeployedOrganigramAddresses = {
  organs: string[]
  assets: string[]
  procedures: string[]
}

/** The input is copied with its new addresses: class instances come back as plain objects. */
export type DeployOrganigramResult = readonly [
  organs: string[],
  assets: string[],
  procedures: string[]
] & {
  organigram: DeployOrganigramInput
}

export const createDeployOrganigramResult = (
  addresses: DeployedOrganigramAddresses,
  organigram: DeployOrganigramInput
): DeployOrganigramResult =>
  Object.assign(
    [addresses.organs, addresses.assets, addresses.procedures] as [
      string[],
      string[],
      string[]
    ],
    { organigram }
  )

const procedureContractNames: Record<
  ProcedureTypeName,
  Omit<ContractName, 'OrganigramClient' | 'Organ' | 'Asset' | 'EquityToken'>
> = {
  erc20Vote: 'ERC20VoteProcedure',
  nomination: 'NominationProcedure',
  vote: 'VoteProcedure'
}

const normalizeReplacementKey = (address: string | null | undefined) => {
  const normalized = address?.trim()
  return normalized == null || normalized === ''
    ? undefined
    : normalized.toLowerCase()
}

const replaceKnownAddress = (
  address: string | null | undefined,
  replacements: Map<string, string>
) => {
  const key = normalizeReplacementKey(address)
  return key == null ? address : (replacements.get(key) ?? address)
}

const replaceKnownAddressesInArgs = (
  args: unknown[] | undefined,
  replacements: Map<string, string>
): unknown[] | undefined =>
  args?.map(arg => {
    if (typeof arg === 'string') return replaceKnownAddress(arg, replacements)
    if (Array.isArray(arg)) {
      return replaceKnownAddressesInArgs(arg, replacements)
    }
    return arg
  })

const replaceKnownAddressesInData = (
  data: string | null | undefined,
  replacements: Map<string, string>
): string | null | undefined => {
  if (data == null || data === '') return data

  try {
    const parsed = JSON.parse(data)
    return JSON.stringify({
      ...parsed,
      erc20:
        typeof parsed.erc20 === 'string'
          ? replaceKnownAddress(parsed.erc20, replacements)
          : parsed.erc20,
      requireMemberMajority: parsed.requireMemberMajority
    })
  } catch {
    return data
  }
}

const getPredictedAddress = (
  type: Omit<ContractName, 'OrganigramClient'>,
  chainId: string,
  deployer: string,
  item: MaybeAddressed
) => {
  if (item.isDeployed === true || item.salt == null || item.salt === '') {
    return undefined
  }

  return predictContractAddress({
    type,
    chainId,
    salt: item.salt,
    deployer
  })
}

export const refreshUndeployedContractReferences = <
  Input extends DeployOrganigramInput
>(
  input: Input,
  chainId: string,
  deployer: string
): Input => {
  const replacements = new Map<string, string>()

  const addReplacement = (
    item: MaybeAddressed,
    predictedAddress: string | undefined
  ) => {
    const key = normalizeReplacementKey(item.address)
    if (key != null && predictedAddress != null) {
      replacements.set(key, predictedAddress)
    }
  }

  input.organs.forEach(organ =>
    addReplacement(
      organ,
      getPredictedAddress('Organ', chainId, deployer, organ)
    )
  )
  input.assets.forEach(asset =>
    addReplacement(
      asset,
      getPredictedAddress(
        asset.kind === 'equity' ? 'EquityToken' : 'Asset',
        chainId,
        deployer,
        asset
      )
    )
  )
  input.procedures.forEach(procedure =>
    addReplacement(
      procedure,
      getPredictedAddress(
        procedureContractNames[procedure.typeName],
        chainId,
        deployer,
        procedure
      )
    )
  )

  const organs = input.organs.map(organ => ({
    ...organ,
    address:
      getPredictedAddress('Organ', chainId, deployer, organ) ??
      organ.address,
    permissions: organ.permissions?.map(permission => ({
      ...permission,
      permissionAddress: replaceKnownAddress(
        permission.permissionAddress,
        replacements
      ) as string
    }))
  }))

  const assets = input.assets.map(asset => ({
    ...asset,
    address:
      getPredictedAddress(
        asset.kind === 'equity' ? 'EquityToken' : 'Asset',
        chainId,
        deployer,
        asset
      ) ?? asset.address,
    decisionProcedure: replaceKnownAddress(
      asset.decisionProcedure,
      replacements
    )
  }))

  const procedures = input.procedures.map(procedure => ({
    ...procedure,
    address:
      getPredictedAddress(
        procedureContractNames[procedure.typeName],
        chainId,
        deployer,
        procedure
      ) ?? procedure.address,
    deciders: replaceKnownAddress(procedure.deciders, replacements) as string,
    proposers: replaceKnownAddress(procedure.proposers, replacements),
    moderators: replaceKnownAddress(procedure.moderators, replacements),
    data:
      replaceKnownAddressesInData(procedure.data, replacements) ?? undefined,
    args: replaceKnownAddressesInArgs(procedure.args, replacements)
  }))

  return {
    ...input,
    organs,
    assets,
    procedures
  } as Input
}

export const applyDeployedOrganigramAddresses = <
  Input extends DeployOrganigramInput
>(
  input: Input,
  deployedAddresses: DeployedOrganigramAddresses,
  refreshedInput: DeployOrganigramInput = input
): Input => {
  const replacements = new Map<string, string>()
  const addAddressReplacement = (
    original: MaybeAddressed,
    refreshed: MaybeAddressed | undefined,
    deployedAddress: string | undefined
  ) => {
    if (deployedAddress == null || deployedAddress === '') return

    const originalKey = normalizeReplacementKey(original.address)
    const refreshedKey = normalizeReplacementKey(refreshed?.address)
    if (originalKey != null) replacements.set(originalKey, deployedAddress)
    if (refreshedKey != null) replacements.set(refreshedKey, deployedAddress)
  }

  const originalOrgans = input.organs.filter(
    organ => organ.isDeployed !== true
  )
  const refreshedOrgans = refreshedInput.organs.filter(
    organ => organ.isDeployed !== true
  )
  const originalAssets = input.assets.filter(
    asset => asset.isDeployed !== true
  )
  const refreshedAssets = refreshedInput.assets.filter(
    asset => asset.isDeployed !== true
  )
  const originalProcedures = input.procedures.filter(
    procedure => procedure.isDeployed !== true
  )
  const refreshedProcedures = refreshedInput.procedures.filter(
    procedure => procedure.isDeployed !== true
  )

  originalOrgans.forEach((organ, index) =>
    addAddressReplacement(
      organ,
      refreshedOrgans[index],
      deployedAddresses.organs[index]
    )
  )
  originalAssets.forEach((asset, index) =>
    addAddressReplacement(
      asset,
      refreshedAssets[index],
      deployedAddresses.assets[index]
    )
  )
  originalProcedures.forEach((procedure, index) =>
    addAddressReplacement(
      procedure,
      refreshedProcedures[index],
      deployedAddresses.procedures[index]
    )
  )

  let organIndex = 0
  const organs = input.organs.map(organ => {
    const deployedAddress =
      organ.isDeployed === true
        ? undefined
        : deployedAddresses.organs[organIndex++]
    return {
      ...organ,
      address: deployedAddress ?? organ.address,
      isDeployed:
        deployedAddress != null ? true : organ.isDeployed,
      permissions: organ.permissions?.map(permission => ({
        ...permission,
        permissionAddress: replaceKnownAddress(
          permission.permissionAddress,
          replacements
        ) as string
      }))
    }
  })

  let assetIndex = 0
  const assets = input.assets.map(asset => {
    const deployedAddress =
      asset.isDeployed === true
        ? undefined
        : deployedAddresses.assets[assetIndex++]
    return {
      ...asset,
      address: deployedAddress ?? asset.address,
      isDeployed:
        deployedAddress != null ? true : asset.isDeployed
    }
  })

  let procedureIndex = 0
  const procedures = input.procedures.map(procedure => {
    const deployedAddress =
      procedure.isDeployed === true
        ? undefined
        : deployedAddresses.procedures[procedureIndex++]
    return {
      ...procedure,
      address: deployedAddress ?? procedure.address,
      isDeployed:
        deployedAddress != null
          ? true
          : procedure.isDeployed,
      deciders: replaceKnownAddress(procedure.deciders, replacements) as string,
      proposers: replaceKnownAddress(procedure.proposers, replacements),
      moderators: replaceKnownAddress(procedure.moderators, replacements),
      data:
        replaceKnownAddressesInData(procedure.data, replacements) ?? undefined,
      args: replaceKnownAddressesInArgs(procedure.args, replacements)
    }
  })

  return {
    ...input,
    organs,
    assets,
    procedures
  } as Input
}

export const markExistingOrganigramDeployments = async <
  Input extends DeployOrganigramInput
>(
  input: Input,
  publicClient: PublicClient
): Promise<Input> => {
  const hasCode = async (address: string | null | undefined) => {
    if (address == null || !isAddress(address)) return false

    try {
      const code = await publicClient.getCode({
        address: address as `0x${string}`
      })
      return code != null && code !== '0x'
    } catch {
      return false
    }
  }

  const organs = await Promise.all(
    input.organs.map(async organ =>
      organ.isDeployed === true ||
      !(await hasCode(organ.address))
        ? organ
        : { ...organ, isDeployed: true }
    )
  )
  const assets = await Promise.all(
    input.assets.map(async asset =>
      asset.isDeployed === true ||
      !(await hasCode(asset.address))
        ? asset
        : { ...asset, isDeployed: true }
    )
  )
  const procedures = await Promise.all(
    input.procedures.map(async procedure =>
      procedure.isDeployed === true ||
      !(await hasCode(procedure.address))
        ? procedure
        : { ...procedure, isDeployed: true }
    )
  )

  return {
    ...input,
    organs,
    assets,
    procedures
  } as Input
}
