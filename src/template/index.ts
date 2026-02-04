// import forProfit from './for-profit.json'
// import nonProfit from './non-profit.json'
// import openSource from './open-source.json'
import none from './none.json'
import {
  capitalize,
  createRandom32BytesHexId,
  predictContractAddress
} from '../utils'
import { OrganigramJson } from '../organigram'
import { OrganJson } from '../organ'
import { ProcedureJson } from '../procedure'
import { AssetJson } from '../asset'

export const templates = {
  // forProfit,
  // nonProfit,
  // openSource,
  none
}

const renewSalts = <T extends { salt?: string }>(
  pv: Record<string, string>,
  cv: T
): Record<string, string> =>
  Object.assign(pv, { [cv.salt!]: createRandom32BytesHexId() })

const renewAddresses =
  <
    T extends {
      address: string
      typeName?: string
      chainId?: string
      salt?: string
    }
  >(
    _: Record<string, string>,
    type: string,
    chainId: string
  ) =>
  (pv: Record<string, string>, cv: T): Record<string, string> =>
    Object.assign(pv, {
      [cv.address]: predictContractAddress({
        type:
          type === 'Procedure'
            ? ((capitalize(cv.typeName!) + type) as 'NominationProcedure')
            : (type as 'Organ'),
        chainId: cv.chainId! ?? chainId,
        salt: cv.salt!
      })
    })

export const renewSaltsAndAddresses = (
  organigram: OrganigramJson,
  chainId: string
) => {
  const newOrganSalts =
    organigram.organs?.reduce(renewSalts<OrganJson>, {}) ?? {}
  const newAssetSalts =
    organigram.assets?.reduce(renewSalts<AssetJson>, {}) ?? {}
  const newProcedureSalts =
    organigram.procedures?.reduce(renewSalts<ProcedureJson>, {}) ?? {}
  const newOrganAddresses =
    organigram.organs?.reduce(
      renewAddresses(newOrganSalts, 'Organ', chainId),
      {}
    ) ?? {}
  const newAssetAddresses =
    organigram.assets?.reduce(
      renewAddresses(newAssetSalts, 'Asset', chainId),
      {}
    ) ?? {}
  const newProcedureAddresses =
    organigram.procedures?.reduce(
      renewAddresses(newProcedureSalts, 'Procedure', chainId),
      {}
    ) ?? {}

  const organs = organigram.organs?.map(organ => ({
    ...organ,
    salt: newOrganSalts[organ.salt!],
    address: newOrganAddresses[organ.address!],
    chainId,
    permissions: organ.permissions?.map(permission => ({
      ...permission,
      permissionAddress: newProcedureAddresses[permission.permissionAddress!]
    }))
  }))

  const procedures = organigram.procedures?.map(procedure => ({
    ...procedure,
    salt: newProcedureSalts[procedure.salt!],
    chainId,
    address: newProcedureAddresses[procedure.address!],
    deciders: newOrganAddresses[procedure.deciders!],
    proposers: newOrganAddresses[procedure.proposers!],
    moderators: procedure.moderators
      ? newOrganAddresses[procedure.moderators!]
      : undefined
  }))

  const assets = organigram.assets?.map(asset => ({
    ...asset,
    chainId,
    salt: newAssetSalts[asset.salt!],
    address: newAssetAddresses[asset.address]
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
  templateName: keyof typeof templates,
  chainId: string
) => renewSaltsAndAddresses(templates[templateName], chainId)
