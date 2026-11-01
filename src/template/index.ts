import none from './none.json' with { type: 'json' }
import nonProfit from './non-profit.json' with { type: 'json' }
import openSource from './open-source.json' with { type: 'json' }
import participatoryBudget from './budget.json' with { type: 'json' }
import sas from './sas.json' with { type: 'json' }
import sasu from './sasu.json' with { type: 'json' }
import sa from './sa.json' with { type: 'json' }
import sarl from './sarl.json' with { type: 'json' }
import accountingRecords from './accounting-records.json' with { type: 'json' }
import employmentSafetyRecords from './employment-safety-records.json' with { type: 'json' }
import dataProcessingRegister from './data-processing-register.json' with { type: 'json' }
import corporateFilings from './corporate-filings.json' with { type: 'json' }
import {
  capitalize,
  createRandom32BytesHexId,
  PERMISSIONS,
  predictContractAddress
} from '../utils'
import { OrganigramInput } from '../organigram'
import { OrganInput, type OrganPermission } from '../organ'
import { ProcedureInput } from '../procedure'
import { AssetInput } from '../asset'
import { resolveDeployment, type ProtocolDeploymentName } from '../deployments'

export const templates = {
  none,
  nonProfit,
  openSource,
  participatoryBudget,
  sas: sas as OrganigramInput,
  sasu: sasu as OrganigramInput,
  sa: sa as OrganigramInput,
  sarl: sarl as OrganigramInput,
  accountingRecords,
  employmentSafetyRecords,
  dataProcessingRegister,
  corporateFilings
}

export type TemplateName = keyof typeof templates

const templateDeploymentRequirements: Partial<
  Record<TemplateName, ProtocolDeploymentName[]>
> = {
  sas: ['EquityToken'],
  sasu: ['EquityToken'],
  sa: ['EquityToken'],
  sarl: ['EquityToken']
}

/** Returns whether every protocol implementation required by a template exists on a chain. */
export const isTemplateSupportedOnChain = (
  templateName: TemplateName,
  chainId: string
): boolean =>
  (templateDeploymentRequirements[templateName] ?? []).every(
    deploymentName => resolveDeployment(chainId, deploymentName) != null
  )

type RenewableContractInput = {
  address?: string | null
  salt?: string | null
  typeName?: string | null
  chainId?: string | null
  kind?: 'asset' | 'equity' | null
}

type ImportableOrganPermission = Partial<OrganPermission> & {
  procedureSalt?: string | null
  permissionKeys?: string[] | null
}

const permissionValuesByKey = new Map<string, number>(
  Object.entries(PERMISSIONS)
)

const setFirstValue = (
  target: Record<string, string>,
  key: string | null | undefined,
  value: string
) => {
  if (key != null && key !== '' && target[key] == null) {
    target[key] = value
  }
}

const createRenewedContractValues = <T extends RenewableContractInput>(
  items: T[] | undefined,
  type: string,
  chainId: string
) => {
  const values =
    items?.map(item => {
      const salt = createRandom32BytesHexId()
      const address = predictContractAddress({
        type:
          type === 'Procedure'
            ? ((capitalize(item.typeName!) + type) as 'NominationProcedure')
            : item.kind === 'equity'
              ? 'EquityToken'
              : (type as 'Organ'),
        chainId,
        salt
      })

      return {
        item,
        salt,
        address
      }
    }) ?? []

  const salts: Record<string, string> = {}
  const addresses: Record<string, string> = {}
  const addressBySalt: Record<string, string> = {}

  for (const value of values) {
    setFirstValue(salts, value.item.salt, value.salt)
    setFirstValue(addresses, value.item.address, value.address)
    setFirstValue(addressBySalt, value.item.salt, value.address)
  }

  return {
    values,
    salts,
    addresses,
    addressBySalt
  }
}

const resolveRenewedAddress = (
  reference: string | null | undefined,
  renewal: ReturnType<typeof createRenewedContractValues>
) =>
  reference == null
    ? ''
    : (renewal.addresses[reference] ?? renewal.addressBySalt[reference] ?? '')

const resolvePermissionValue = (
  permission: ImportableOrganPermission
): number => {
  if (typeof permission.permissionValue === 'number') {
    return permission.permissionValue
  }

  return (permission.permissionKeys ?? []).reduce((value, key) => {
    const permissionValue = permissionValuesByKey.get(key)
    return typeof permissionValue === 'number' ? value | permissionValue : value
  }, 0)
}

const normalizeOrganPermission = (
  permission: ImportableOrganPermission,
  procedureRenewal: ReturnType<typeof createRenewedContractValues>,
  assetRenewal: ReturnType<typeof createRenewedContractValues>
): OrganPermission | undefined => {
  const permissionReference =
    permission.permissionAddress ?? permission.procedureSalt
  const permissionAddress =
    resolveRenewedAddress(permissionReference, procedureRenewal) ||
    resolveRenewedAddress(permissionReference, assetRenewal)
  const permissionValue = resolvePermissionValue(permission)

  if (permissionAddress === '' || permissionValue <= 0) {
    return undefined
  }

  return {
    permissionAddress,
    permissionValue
  }
}

export const renewSaltsAndAddresses = (
  organigram: OrganigramInput,
  chainId: string
): OrganigramInput => {
  const organRenewal = createRenewedContractValues<OrganInput>(
    organigram.organs,
    'Organ',
    chainId
  )
  const assetRenewal = createRenewedContractValues<AssetInput>(
    organigram.assets,
    'Asset',
    chainId
  )
  const procedureRenewal = createRenewedContractValues<ProcedureInput>(
    organigram.procedures,
    'Procedure',
    chainId
  )

  const organs = organRenewal.values.map(({ item: organ, salt, address }) => ({
    ...organ,
    salt,
    address,
    chainId,
    isDeployed: false,
    permissions: organ.permissions
      ?.map(permission =>
        normalizeOrganPermission(
          permission as ImportableOrganPermission,
          procedureRenewal,
          assetRenewal
        )
      )
      .filter(
        (permission): permission is OrganPermission => permission != null
      )
  }))

  const procedures = procedureRenewal.values.map(
    ({ item: procedure, salt, address }) => ({
    ...procedure,
    salt,
    chainId,
    data: (() => {
      const data = JSON.parse(procedure.data ?? '{}') as Record<string, unknown>
      return JSON.stringify({
        ...data,
        ...(typeof data.erc20 === 'string'
          ? { erc20: resolveRenewedAddress(data.erc20, assetRenewal) }
          : {}),
      })
    })(),
    isDeployed: false,
    address,
    deciders: resolveRenewedAddress(procedure.deciders, organRenewal),
    proposers: resolveRenewedAddress(procedure.proposers, organRenewal),
    moderators: procedure.moderators
      ? resolveRenewedAddress(procedure.moderators, organRenewal)
      : undefined
    })
  )

  const assets = assetRenewal.values.map(({ item: asset, salt, address }) => ({
    ...asset,
    chainId,
    isDeployed: false,
    salt,
    address,
    decisionProcedure:
      asset.kind === 'equity'
        ? resolveRenewedAddress(asset.decisionProcedure, procedureRenewal)
        : asset.decisionProcedure
  }))

  return {
    ...organigram,
    chainId,
    organs,
    procedures,
    assets
  }
}

export const getTemplate = (
  templateName: TemplateName,
  chainId: string
) =>
  renewSaltsAndAddresses(
    templates[templateName],
    chainId
  )
