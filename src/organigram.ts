import { Signer } from 'ethers'

import { Asset, AssetJson } from './asset'
import Organ, { OrganInput, OrganJson } from './organ'
import { Procedure, ProcedureJson } from './procedure'
import OrganigramClient, {
  DeployOrganigramInput,
  EnhancedProcedure
} from './organigramClient'
import { getTemplate, templates } from './template'

export type SourceOrgan = {
  organAddress: string
  procedureAddress: string
  assetAddress?: string
}

export type SourcesAndTargets = {
  isSourceOrgan: SourceOrgan[]
  isTargetOrgan: TargetOrgan[]
}

export type ProcedureSourcesAndTargets = {
  targetOrgans: TargetOrgan[]
  sourceOrgans: SourceOrgan[]
}

export type TargetOrgan = SourceOrgan & { permissionValue: number }
export type OrganWithSourcesAndTargets = Organ & SourcesAndTargets
export type AssetWithSourcesAndTargets = Asset & SourcesAndTargets
export type ProcedureWithSourcesAndTargets = EnhancedProcedure &
  ProcedureSourcesAndTargets

export type OrganigramJson = {
  organs: OrganJson[]
  procedures: ProcedureJson[]
  assets: AssetJson[]
}

export const getProcedureSourcesAndTargets = (
  procedure: Procedure,
  organigram: Organigram
): ProcedureWithSourcesAndTargets => {
  if (procedure.sourceOrgans && procedure.targetOrgans) {
    return procedure as ProcedureWithSourcesAndTargets
  }
  const sourceOrgans = [
    procedure.deciders,
    procedure.proposers,
    procedure.moderators
  ]
    .filter((address): address is string => address != null)
    .map(address => ({
      procedureAddress: procedure.address,
      organAddress: address
    }))
  const targetOrgans = organigram.organs
    .filter(organ =>
      organ.permissions?.some(
        permission => permission.permissionAddress === procedure.address
      )
    )
    ?.map(organ => ({
      permissionValue: organ.permissions!.find(
        permission => permission.permissionAddress === procedure.address
      )!.permissionValue,
      procedureAddress: procedure.address,
      organAddress: organ.address!
    }))

  return {
    ...procedure,
    sourceOrgans,
    targetOrgans
  } as ProcedureWithSourcesAndTargets
}

export const getOrganSourcesAndTargets = (
  organ: OrganInput,
  organigram: Organigram
): OrganWithSourcesAndTargets => {
  if (organ.isSource || organ.isTarget) {
    return organ as OrganWithSourcesAndTargets
  }
  const isSource = organigram.procedures
    .filter(
      procedure =>
        procedure.deciders === organ.address ||
        procedure.proposers === organ.address ||
        procedure.moderators === organ.address
    )
    .map(procedure => ({
      procedureAddress: procedure.address,
      organAddress: organ.address!
    }))
  const isTarget = organ.permissions?.map(permission => ({
    permissionValue: permission.permissionValue,
    procedureAddress: permission.permissionAddress,
    organAddress: organ.address!
  }))
  return {
    ...organ,
    isSource,
    isTarget
  } as OrganWithSourcesAndTargets
}

export const getAssetSourcesAndTargets = (
  asset: Asset,
  organigram: Organigram
): AssetWithSourcesAndTargets => {
  if (asset.isSourceOrgan) {
    return asset as AssetWithSourcesAndTargets
  }
  const isSource = organigram.procedures
    .filter(
      procedure =>
        procedure.deciders === asset.address ||
        procedure.proposers === asset.address ||
        procedure.moderators === asset.address
    )
    .map(procedure => ({
      procedureAddress: procedure.address,
      assetAddress: asset.address
    }))
  return {
    ...asset,
    isSourceOrgan: isSource
  } as AssetWithSourcesAndTargets
}

export const getSourcesAndTargets = (initialOrganigram: OrganigramInput) => {
  const organs = initialOrganigram.organs?.map(organ =>
    getOrganSourcesAndTargets(organ, initialOrganigram as Organigram)
  )
  const procedures = initialOrganigram.procedures?.map(procedure =>
    getProcedureSourcesAndTargets(
      procedure as Procedure,
      initialOrganigram as Organigram
    )
  )
  const assets = initialOrganigram.assets?.map(asset =>
    getAssetSourcesAndTargets(asset as Asset, initialOrganigram as Organigram)
  )

  return { ...initialOrganigram, organs, procedures, assets }
}

export const makeOrganigramDeployArgument = (
  organigram: Organigram,
  signer?: Signer
): DeployOrganigramInput => {
  return {} as DeployOrganigramInput
}

export type OrganigramInput = Partial<{
  id?: string
  name?: string
  description?: string
  chainId?: string
  organs: OrganInput[]
  procedures: Partial<ProcedureWithSourcesAndTargets>[]
  assets: Partial<AssetWithSourcesAndTargets>[]
  client?: OrganigramClient
  signer?: Signer
  contractAddresses?: string[]
}>

export const defaultChainId = '11155111'

export class Organigram {
  organs: OrganWithSourcesAndTargets[] = []
  procedures: ProcedureWithSourcesAndTargets[] = []
  assets: AssetWithSourcesAndTargets[] = []
  chainId: string
  id?: string
  name?: string
  description?: string
  client?: OrganigramClient
  signer?: Signer

  constructor(input?: OrganigramInput | keyof typeof templates | string[]) {
    let _organigram
    if (input == null) {
      _organigram = getTemplate('none', defaultChainId)
    } else if (typeof input === 'string' && input in templates) {
      _organigram = getTemplate(input, defaultChainId)
    } else if (typeof input === 'object' && Array.isArray(input)) {
      // Load all contracts at these addresses
    } else _organigram = input

    const initTyped = _organigram as Organigram
    this.name = initTyped?.name ?? 'Blank project'
    this.description =
      initTyped?.description ?? 'This is the default organigram.'
    this.id = initTyped?.id
    this.organs = initTyped?.organs!
    this.procedures = initTyped?.procedures!
    this.assets = initTyped?.assets!
    this.chainId = initTyped?.chainId ?? defaultChainId
    this.client = initTyped?.client
    this.signer = initTyped?.signer
  }

  editDetails({
    name,
    description
  }: {
    name?: string
    description?: string
    contractAddresses?: string[]
  }) {
    if (name !== undefined) this.name = name
    if (description !== undefined) this.description = description
  }

  setOrgans(organs: Organ[]) {}
  setAssets(assets: Asset[]) {}
  setProcedures(procedures: Procedure[]) {}

  load = async (
    options: { discover: boolean; limit: number } = {
      discover: true,
      limit: 100
    }
  ) => {
    // If no argument, reload organigram
    this.client?.loadOrganigram(this, undefined, options)
  }

  async deploy(signer?: Signer) {
    const deployArgument = makeOrganigramDeployArgument(this, signer)
    return await this.client
      ?.deployOrganigram(deployArgument)
      .then(async () => await this?.load())
  }

  toJson = () =>
    JSON.stringify({
      id: this.id,
      name: this.name,
      description: this.description,
      organs: this.organs,
      procedures: this.procedures,
      assets: this.assets
    })
}
