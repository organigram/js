import { Signer } from 'ethers'

import { Asset, AssetInput, AssetJson } from './asset'
import Organ, { OrganInput, OrganJson } from './organ'
import { Procedure, ProcedureInput, ProcedureJson } from './procedure'
import OrganigramClient from './organigramClient'
import { getTemplate, templates } from './template'

export type SourceOrganTypeName =
  | 'proposers'
  | 'moderators'
  | 'deciders'
  | 'target'

export type SourceOrgan = {
  organAddress?: string | null
  procedureAddress?: string | null
  assetAddress?: string | null
  types?: SourceOrganTypeName[]
}

export const sourceOrganTypes = [
  { label: 'Create proposals', name: 'proposers' },
  { label: 'Approve proposals', name: 'deciders' },
  { label: 'Filter proposals', name: 'moderators' }
]

export type SourcesAndTargets = {
  isSourceOrgan: SourceOrgan[]
  isTargetOrgan: TargetOrgan[]
}

export type ProcedureSourcesAndTargets = {
  targetOrgans: TargetOrgan[]
  sourceOrgans: SourceOrgan[]
}

export type TargetOrgan = SourceOrgan & { permissionValue: number }

export type OrganigramJson = {
  id: string
  slug: string
  name: string
  description: string
  chainId: string
  organs: OrganJson[]
  procedures: ProcedureJson[]
  assets: AssetJson[]
  workspaceId?: string | null
}

export const getProcedureSourcesAndTargets = (
  procedure: ProcedureInput,
  organigram: OrganigramJson
): ProcedureJson => {
  if (procedure.sourceOrgans && procedure.targetOrgans) {
    return procedure as ProcedureJson
  }

  const sources = Array.from(
    new Set(
      [procedure.deciders, procedure.proposers, procedure.moderators].filter(
        Boolean
      ) as string[]
    )
  )
  const sourceOrgans = sources.reduce((acc, source) => {
    // If the source is already in the list, update its types
    if (acc.some(sourceOrgan => sourceOrgan.organAddress === source)) {
      return acc.map(sourceOrgan => {
        if (sourceOrgan.organAddress === source) {
          return {
            ...sourceOrgan,
            types: [
              ...(sourceOrgan.types ?? []),
              ...(procedure.proposers === source ? ['proposers'] : []),
              ...(procedure.deciders === source ? ['deciders'] : []),
              ...(procedure.moderators === source ? ['moderators'] : [])
            ] as SourceOrganTypeName[]
          }
        }
        return sourceOrgan
      })
    }
    const organ = organigram.organs.find(organ => organ.address === source)
    if (organ) {
      return [
        ...acc,
        {
          organAddress: organ.address!,
          procedureAddress: procedure.address,
          types: [
            ...(procedure.proposers === source ? ['proposers'] : []),
            ...(procedure.deciders === source ? ['deciders'] : []),
            ...(procedure.moderators === source ? ['moderators'] : [])
          ] as SourceOrganTypeName[]
        }
      ]
    }
    return acc
  }, [] as SourceOrgan[])

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
  } as ProcedureJson
}

export const getOrganSourcesAndTargets = (
  organ: OrganInput,
  organigram: Organigram
): OrganJson => {
  if (organ.isSource || organ.isTarget) {
    return organ as OrganJson
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
  } as OrganJson
}

export const getAssetSourcesAndTargets = (
  asset: Asset,
  organigram: Organigram
): Asset => {
  if (asset.isSourceOrgan) {
    return asset as Asset
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
  } as Asset
}

export const getSourcesAndTargets = (
  initialOrganigram: OrganigramInput
): OrganigramJson => {
  const organs = initialOrganigram.organs?.map(organ =>
    getOrganSourcesAndTargets(organ, initialOrganigram as Organigram)
  )
  const procedures = initialOrganigram.procedures?.map(procedure =>
    getProcedureSourcesAndTargets(
      procedure as Procedure,
      initialOrganigram as OrganigramJson
    )
  )
  const assets = initialOrganigram.assets?.map(asset =>
    getAssetSourcesAndTargets(asset as Asset, initialOrganigram as Organigram)
  )

  return { ...initialOrganigram, organs, procedures, assets } as OrganigramJson
}

export type OrganigramInput = {
  id?: string | null
  slug?: string | null
  name?: string | null
  description?: string | null
  chainId?: string | null
  organs: OrganInput[]
  procedures: ProcedureInput[]
  assets: AssetInput[]
  organigramClient?: OrganigramClient | null
  signer?: Signer | null
  contractAddresses?: string[] | null
  workspaceId?: string | null
}

export const defaultChainId = '11155111'

export class Organigram {
  id: string
  organs: Organ[] = []
  assets: Asset[] = []
  procedures: Procedure[] = []
  chainId: string
  slug: string
  name: string
  description: string
  workspaceId?: string | null
  organigramClient?: OrganigramClient | null
  signer?: Signer | null

  constructor(input?: OrganigramInput | keyof typeof templates | string[]) {
    let _organigram
    if (input == null) {
      _organigram = getTemplate('none', defaultChainId)
    } else if (typeof input === 'string' && input in templates) {
      _organigram = getTemplate(input, defaultChainId)
    } else if (typeof input === 'object' && Array.isArray(input)) {
      // Load all contracts at these addresses
    } else _organigram = getSourcesAndTargets(input as OrganigramInput)

    const initTyped = _organigram as Organigram
    this.name = initTyped?.name ?? 'Blank project'
    this.description =
      initTyped?.description ?? 'This is the default organigram.'
    this.id = initTyped?.id ?? crypto.randomUUID()
    this.slug = initTyped?.slug ?? this.id
    this.organs = initTyped?.organs ?? []
    this.procedures = initTyped?.procedures ?? []
    this.assets = initTyped?.assets ?? []
    this.chainId = initTyped?.chainId ?? defaultChainId
    this.organigramClient = initTyped?.organigramClient
    this.signer = initTyped?.signer
    this.workspaceId = initTyped?.workspaceId
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

  load = async (input?: {
    signer?: Signer | null
    // options?: { discover: boolean; limit: number }
  }): Promise<Organigram> => {
    const { signer } = input ?? {}
    if (!this.organigramClient && !this.signer && !signer) {
      throw new Error(
        'Cannot load organigram: neither Organigram client or signer are set.'
      )
    }
    if (
      [...this.procedures, ...this.organs].every(
        item => item.isDeployed !== true
      )
    ) {
      return this
    }
    const client =
      this.organigramClient ??
      new OrganigramClient({
        signer: signer ?? this.signer!,
        provider: signer?.provider ?? this.signer?.provider!
      })
    return await client.loadOrganigram(this, false)!
  }

  async deploy() {
    if (!this.organigramClient) {
      throw new Error('Organigram client not set.')
    }
    return await this.organigramClient
      .deployOrganigram(this)
      .then(async () => await this?.load())
  }

  toJson = (): OrganigramJson =>
    JSON.parse(
      JSON.stringify({
        id: this.id,
        slug: this.slug,
        workspaceId: this.workspaceId,
        chainId: this.chainId,
        name: this.name,
        description: this.description,
        organs: this.organs.map(organ => organ.toJson?.() ?? organ),
        assets: this.assets.map(asset => asset.toJson?.() ?? asset),
        procedures: this.procedures.map(
          procedure => procedure.toJson?.() ?? procedure
        )
      })
    )
}
