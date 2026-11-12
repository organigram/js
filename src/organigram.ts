import { Asset, type AssetInput, type AssetJson } from './asset'
import { Organ, type OrganInput, type OrganJson } from './organ'
import { Procedure, type ProcedureInput, type ProcedureJson } from './procedure'
import OrganigramClient from './organigramClient'
import { getTemplate, templates } from './template'
import { getDefaultChainId } from './deployments'
import { handleJsonBigInt } from './utils'
import type { PublicClient, WalletClient } from 'viem'

/** The three roles of a procedure: who proposes, who moderates, who decides. */
export type ProcedureRoleTypeName = 'proposers' | 'moderators' | 'deciders'

/** Line styles available to draw the links of an organigram. */
export const organigramEdgeTypes = [
  'default',
  'straight',
  'step',
  'smoothstep'
  // 'simplebezier'
] as const

/** Line style of the links of an organigram. */
export type OrganigramEdgeType = (typeof organigramEdgeTypes)[number]

/** Line style used when none is set. */
export const defaultOrganigramEdgeType: OrganigramEdgeType = 'default'

/** Position of one node in the organigram diagram. */
export type OrganigramNodePosition = {
  x: number
  y: number
}

/** Positions of the nodes in the organigram diagram, by contract address. */
export type OrganigramNodePositions = Record<string, OrganigramNodePosition>

export const normalizeOrganigramEdgeType = (
  edgeType?: string | null
): OrganigramEdgeType =>
  organigramEdgeTypes.includes(edgeType as OrganigramEdgeType)
    ? (edgeType as OrganigramEdgeType)
    : defaultOrganigramEdgeType

export const normalizeOrganigramNodePositions = (
  nodePositions?: unknown
): OrganigramNodePositions => {
  if (nodePositions == null || typeof nodePositions !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(nodePositions).flatMap(([key, value]) => {
      if (
        value != null &&
        typeof value === 'object' &&
        typeof value.x === 'number' &&
        Number.isFinite(value.x) &&
        typeof value.y === 'number' &&
        Number.isFinite(value.y)
      ) {
        return [[key, { x: value.x, y: value.y }]]
      }

      return []
    })
  )
}

/** An organigram as plain JSON, to store or send it. */
export type OrganigramJson = {
  id: string
  slug: string
  name: string
  description: string
  edgeType: OrganigramEdgeType
  nodePositions: OrganigramNodePositions
  chainId: string
  organs: OrganJson[]
  procedures: ProcedureJson[]
  assets: AssetJson[]
  workspaceId?: string | null
}

/** The data of an organigram, such as a template from `getTemplate()`. */
export type OrganigramInput = {
  id?: string | null
  slug?: string | null
  name?: string | null
  description?: string | null
  edgeType?: string | null
  nodePositions?: unknown
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

/** Chain used by templates when none is given. */
export const defaultChainId = getDefaultChainId()

/**
 * A whole organization: its organs, procedures and assets, as a draft or as deployed contracts.
 *
 * @remarks The organigram itself has no contract. Create one from a template or from data, attach an `OrganigramClient`, then call `deploy()`.
 *
 * @example
 * ```ts
 * const organigram = await new Organigram({
 *   ...getTemplate('nonProfit', client.chainId),
 *   organigramClient: client
 * }).deploy()
 * ```
 */
export class Organigram {
  /** Identifier of the organigram. */
  id: string
  /** Organs of the organization. */
  organs: Organ[] = []
  /** Assets of the organization. */
  assets: Asset[] = []
  /** Procedures connecting the organs. */
  procedures: Procedure[] = []
  /** Chain the organigram is deployed on. */
  chainId: string
  /** URL-friendly name. */
  slug: string
  /** Display name. */
  name: string
  /** Free description. */
  description: string
  /** Line style of the diagram links. */
  edgeType: OrganigramEdgeType
  /** Positions of the diagram nodes. */
  nodePositions: OrganigramNodePositions
  /** Workspace the organigram belongs to in the Organigram app. */
  workspaceId?: string | null
  /** Client used to deploy and load the organigram. */
  organigramClient?: OrganigramClient | null
  /** Client that signs transactions, when no `organigramClient` is attached. */
  walletClient?: WalletClient | null
  /** Client used for reads, when no `organigramClient` is attached. */
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
    this.description = initial?.description ?? 'This is the default organigram.'
    this.edgeType = normalizeOrganigramEdgeType(initial?.edgeType)
    this.nodePositions = normalizeOrganigramNodePositions(
      initial?.nodePositions
    )
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

  /** Change the name, description or diagram layout. */
  editDetails({
    name,
    description,
    edgeType,
    nodePositions
  }: {
    name?: string
    description?: string
    edgeType?: OrganigramEdgeType
    nodePositions?: OrganigramNodePositions
    contractAddresses?: string[]
  }) {
    if (name !== undefined) this.name = name
    if (description !== undefined) this.description = description
    if (edgeType !== undefined) this.edgeType = edgeType
    if (nodePositions !== undefined) this.nodePositions = nodePositions
  }

  /** Replace the organs. */
  setOrgans(organs: Organ[]) {
    this.organs = organs
  }

  /** Replace the assets. */
  setAssets(assets: Asset[]) {
    this.assets = assets
  }

  /** Replace the procedures. */
  setProcedures(procedures: Procedure[]) {
    this.procedures = procedures
  }

  /**
   * Read every deployed organ, procedure and asset of the organigram from chain.
   *
   * @param input - viem clients, used when no `organigramClient` is attached.
   */
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

  /**
   * Deploy every contract of the organigram in one transaction, then read them back from chain.
   *
   * @remarks Requires an attached `organigramClient` with a wallet client.
   */
  async deploy() {
    if (!this.organigramClient) {
      throw new Error('Organigram client not set.')
    }
    const deployment = await this.organigramClient.deployOrganigram(this)
    const deployedOrganigram = deployment.organigram
    this.setOrgans(deployedOrganigram.organs as Organ[])
    this.setAssets(deployedOrganigram.assets as Asset[])
    this.setProcedures(deployedOrganigram.procedures as Procedure[])

    return await this.load()
  }

  /** Convert the organigram into plain JSON. */
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
          edgeType: this.edgeType,
          nodePositions: this.nodePositions,
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
