import { Asset, type AssetInput, type AssetJson } from './asset'
import { Organ, type OrganInput, type OrganJson } from './organ'
import { Procedure, type ProcedureInput, type ProcedureJson } from './procedure'
import OrganigramClient from './organigramClient'
import { getTemplate, templates } from './template'
import { handleJsonBigInt } from './utils'
import type { PublicClient, WalletClient } from 'viem'

export type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders'

export const procedureRoleTypes = [
  { label: 'Create proposals', name: 'proposers' },
  { label: 'Approve proposals', name: 'deciders' },
  { label: 'Filter proposals', name: 'moderators' }
]

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
  walletClient?: WalletClient | null
  publicClient?: PublicClient | null
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
  walletClient?: WalletClient | null
  publicClient?: PublicClient | null

  constructor(input?: OrganigramInput | keyof typeof templates | string[]) {
    let resolvedOrganigram
    if (input == null) {
      resolvedOrganigram = getTemplate('none', defaultChainId)
    } else if (typeof input === 'string' && input in templates) {
      resolvedOrganigram = getTemplate(input, defaultChainId)
    } else if (typeof input === 'object' && Array.isArray(input)) {
      resolvedOrganigram = undefined
    } else {
      resolvedOrganigram = input as OrganigramInput
    }

    const initial = resolvedOrganigram as Organigram
    this.name = initial?.name ?? 'Blank project'
    this.description =
      initial?.description ?? 'This is the default organigram.'
    this.id = initial?.id ?? crypto.randomUUID()
    this.slug = initial?.slug ?? this.id
    this.organs = initial?.organs ?? []
    this.procedures = initial?.procedures ?? []
    this.assets = initial?.assets ?? []
    this.chainId = initial?.chainId ?? defaultChainId
    this.organigramClient = initial?.organigramClient
    this.walletClient = initial?.walletClient
    this.publicClient = initial?.publicClient
    this.workspaceId = initial?.workspaceId
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
    walletClient?: WalletClient | null
    publicClient?: PublicClient | null
  }): Promise<Organigram> => {
    const publicClient =
      input?.publicClient ??
      this.publicClient ??
      this.organigramClient?.publicClient
    const walletClient = input?.walletClient ?? this.walletClient

    if (!this.organigramClient && publicClient == null) {
      throw new Error(
        'Cannot load organigram: neither Organigram client or public client are set.'
      )
    }
    if (
      [...this.procedures, ...this.organs, ...this.assets].every(
        item => item.isDeployed !== true
      )
    ) {
      return this
    }

    const client =
      this.organigramClient ??
      (await OrganigramClient.load({
        publicClient: publicClient!,
        walletClient: walletClient ?? undefined
      }))

    return await client.loadOrganigram(this)
  }

  async deploy() {
    if (!this.organigramClient) {
      throw new Error('Organigram client not set.')
    }
    return await this.organigramClient
      .deployOrganigram(this)
      .then(async () => await this.load())
  }

  toJson = (): OrganigramJson =>
    JSON.parse(
      JSON.stringify(
        {
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
        },
        handleJsonBigInt
      )
    )
}
