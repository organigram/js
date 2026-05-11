import none from './none.json' with { type: 'json' }
import forProfit from './for-profit.json' with { type: 'json' }
import nonProfit from './non-profit.json' with { type: 'json' }
import openSource from './open-source.json' with { type: 'json' }
import participatoryBudget from './budget.json' with { type: 'json' }
import {
  capitalize,
  createRandom32BytesHexId,
  predictContractAddress
} from '../utils'
import { OrganigramInput } from '../organigram'
import { OrganInput } from '../organ'
import { ProcedureInput } from '../procedure'
import { AssetInput } from '../asset'

export const templates = {
  none,
  forProfit,
  nonProfit,
  openSource,
  participatoryBudget
}

export type TemplateName = keyof typeof templates

type RenewableContractInput = {
  address?: string | null
  salt?: string | null
  typeName?: string | null
  chainId?: string | null
}

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
            : (type as 'Organ'),
        chainId: item.chainId ?? chainId,
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
      ?.map(permission => ({
        ...permission,
        permissionAddress: resolveRenewedAddress(
          permission.permissionAddress,
          procedureRenewal
        )
      }))
      .filter(
        (
          permission
        ): permission is typeof permission & { permissionAddress: string } =>
          permission.permissionAddress !== ''
      )
  }))

  const procedures = procedureRenewal.values.map(
    ({ item: procedure, salt, address }) => ({
    ...procedure,
    salt,
    chainId,
    data: JSON.parse(procedure.data ?? '{}').erc20
      ? JSON.stringify({
          erc20: resolveRenewedAddress(
            JSON.parse(procedure.data!).erc20,
            assetRenewal
          ),
          quorumSize: JSON.parse(procedure.data!).quorumSize,
          voteDuration: JSON.parse(procedure.data!).voteDuration,
          majoritySize: JSON.parse(procedure.data!).majoritySize
        })
      : (procedure.data ?? '{}'),
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
    address
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
) => renewSaltsAndAddresses(templates[templateName], chainId)
