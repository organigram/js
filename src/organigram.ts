import { Signer } from 'ethers'
import { Asset } from './asset'
import Organ from './organ'
import { Procedure } from './procedure'
import OrganigramClient, {
  DeployOrganigramInput,
  EnhancedProcedure
} from './organigramClient'

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

export const getSourcesAndTargets = (initialOrganigram: Organigram) => {
  return initialOrganigram as Organigram
}

export const getProcedureSourcesAndTargets = (
  procedure: Procedure
): ProcedureWithSourcesAndTargets => {
  return procedure as ProcedureWithSourcesAndTargets
}

export const getOrganSourcesAndTargets = (
  organ: Organ
): OrganWithSourcesAndTargets => {
  return organ as OrganWithSourcesAndTargets
}

export const getAssetSourcesAndTargets = (
  asset: Asset
): AssetWithSourcesAndTargets => {
  return asset as AssetWithSourcesAndTargets
}

export const makeOrganigramDeployArgument = (
  organigram: Organigram,
  signer?: Signer
): DeployOrganigramInput => {
  return {} as DeployOrganigramInput
}

export class Organigram {
  // state
  id?: string
  name?: string
  description?: string
  organs: OrganWithSourcesAndTargets[] = []
  procedures: ProcedureWithSourcesAndTargets[] = []
  assets: AssetWithSourcesAndTargets[] = []
  client?: OrganigramClient
  signer?: Signer

  constructor(initialOrganigram: {
    id?: string
    name?: string
    description?: string
    contractAddresses?: string[]
  }) {
    this.name = initialOrganigram.name
    this.description = initialOrganigram.description
    this.id = initialOrganigram.id
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
