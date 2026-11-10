import ProcedureContractABI from '@organigram/protocol/abi/Procedure.sol/Procedure.json' with { type: 'json' }
import {
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  parseAbiParameters,
  isAddress,
  toFunctionSelector,
  toHex,
  type PublicClient,
  type WalletClient,
  zeroAddress
} from 'viem'

import type { TransactionOptions } from '../organigramClient'
import {
  capitalize,
  createRandom32BytesHexId,
  handleJsonBigInt,
  predictContractAddress
} from '../utils'
import { getDefaultChainId, getDeployment } from '../deployments'
import { isCidRef } from '../ipfs/scopeEnvelope'
import { tryMulticall } from '../multicall'
import {
  type PopulateInitializeInput,
  type PopulatedTransactionData,
  type ERC20VoteRoleMode,
  ProcedureTypeName,
  ProcedureTypeNameEnum,
  getProcedureType
} from './utils'
import {
  type ContractClients,
  type OrganigramTransaction,
  type OrganigramTransactionReceipt,
  createContractWriteTransaction,
  getContractInstance,
  getWalletAccount,
  type OrganigramContract
} from '../contracts'

/**
 * A parameter of a procedure type, as shown in a form, such as the vote duration.
 */
export interface ProcedureTypeField {
  /** Key of the parameter in the procedure `data`. */
  name: string
  /** Display label. */
  label: string
  /** Explanation shown to the user. */
  description: string
  /** Value used when none is given. */
  defaultValue: string
  /** Input kind. */
  type: 'string' | 'number' | 'boolean' | 'roleMode' | 'moderatorRoleMode'
}

/**
 * A procedure implementation registered on a chain, which procedures are cloned from.
 */
export interface ProcedureType {
  /** Procedure type name. */
  key: string
  /** Address of the implementation contract. */
  address: string
  /** Label, description and metadata reference of the type. */
  metadata: {
    cid?: string
    label?: string
    description?: string
  }
  /** Parameters specific to the type, by name. */
  fields?: {
    [key: string]: ProcedureTypeField
  }
}

type ProcedureContractData = {
  cid: string
  proposers: string
  moderators: string
  deciders: string
  withModeration: boolean
  proposalsLength: bigint
  interfaceId?: string
}

/** A procedure as plain JSON, to store or send it. */
export type ProcedureJson = {
  isDeployed: boolean
  address: string
  deciders: string
  typeName: ProcedureTypeName
  name: string
  description: string
  cid: string
  salt?: string | null
  chainId: string
  data: string
  metadata?: string
  proposers: string
  moderators: string
  withModeration: boolean
  proposerMode?: ERC20VoteRoleMode
  moderatorMode?: ERC20VoteRoleMode
  voterMode?: ERC20VoteRoleMode
  requireMemberMajority?: boolean
  forwarder: string
  proposals?: ProcedureProposal[]
  args?: unknown[]
  type: ProcedureType
  organigramId?: string | null
}

/** The state of the vote on one proposal. */
export type Election = {
  /** Proposal being voted on. */
  proposalKey: string
  /** Unix time, in seconds, when the vote opened. */
  start: string
  /** Number of ballots cast. */
  votesCount: string
  /** Whether the connected wallet has voted. */
  hasVoted: boolean
  /** Votes for, weighted by tokens for an ERC-20 vote. */
  approvals?: string
  /** Votes against, weighted by tokens for an ERC-20 vote. */
  objections?: string
  /** Total votes that could be cast. */
  eligibleVotes?: string
  /** Whether the proposal passed, once the vote is over. */
  approved?: boolean
}

/** The roles an account holds in a procedure. */
export type AccountInOrgans = {
  /** Whether it may moderate proposals. */
  moderators?: boolean
  /** Whether it may submit proposals. */
  proposers?: boolean
  /** Whether it may decide on proposals. */
  deciders?: boolean
}

/** Keyword describing what an operation does, used to filter and label it. */
export type OperationTag =
  | 'cid'
  | 'entries'
  | 'permissions'
  | 'coins'
  | 'collectibles'
  | 'erc721'
  | 'erc20'
  | 'erc1155'
  | 'ether'
  | 'add'
  | 'replace'
  | 'remove'
  | 'deposit'
  | 'withdraw'
  | 'transfer'

/** Kind of a parameter of an operation, used to build its form. */
export type OperationParamType =
  | 'cid'
  | 'entry'
  | 'entries'
  | 'address'
  | 'bytes'
  | 'addresses'
  | 'index'
  | 'indexes'
  | 'organ'
  | 'oldPermissionAddress'
  | 'newPermissionAddress'
  | 'permissionAddress'
  | 'permissionValue'
  | 'proposal'
  | 'proposals'
  | 'amount'
  | 'tokenId'

/** What an operation parameter is used for in a form. */
export type OperationParamAction =
  | 'select'
  | 'create'
  | 'update'
  | 'delete'
  | 'withdraw'
  | 'deposit'
  | 'transfer'
  | 'block'

/** One decoded parameter of an operation, to display or edit it. */
export interface OperationParam {
  /** Kind of the parameter. */
  type: OperationParamType
  /** What the parameter is used for. */
  action?: OperationParamAction
  /** Decoded value. */
  value?: unknown
  /** Function turning the form value into the call argument. */
  parser?: unknown
}

/**
 * A function a proposal operation can call, with what a form needs to build the call.
 */
export interface ProcedureProposalOperationFunction {
  /** Four-byte function selector. */
  funcSig: string
  /** Function name. */
  key: OperationKey
  /** Solidity signature. */
  signature?: string
  /** Display label. */
  label?: string
  /** Keywords describing the function. */
  tags?: OperationTag[]
  /** Kinds of its parameters, in order. */
  params?: OperationParamType[]
  /** ABI fragment, for functions outside the organ contract. */
  abi?: unknown
  /** Whether the call targets an organ or the procedure itself. */
  target?: 'organ' | 'self'
}

/** A call to a contract outside the organization, made by an organ. */
export interface ExternalCallOperationInput {
  /**
   * Organ making the call. It must allow this call in its execution whitelist.
   */
  organAddress: string
  /** Contract called. */
  target: string
  /** Encoded call. */
  data: string
  /** Ether sent with the call, in wei. */
  value?: string | bigint | number
  /** Position of the operation in the proposal. */
  index?: string | number
}

/** A proposal to sign, so that another account submits it. */
export interface SignedProposalInput {
  /** Reference to the proposal metadata. */
  cid: string
  /** Operations of the proposal. */
  operations: ProcedureProposalOperation[]
  /** Current signature nonce of the signer, from `getNonce()`. */
  nonce: bigint
  /** Unix time, in seconds, after which the signature is refused. */
  deadline: bigint | number
}

/** An action on a proposal to sign, so that another account submits it. */
export interface SignedProposalActionInput {
  /** Proposal the action applies to. */
  proposalKey: string
  /** Current signature nonce of the signer, from `getNonce()`. */
  nonce: bigint
  /** Unix time, in seconds, after which the signature is refused. */
  deadline: bigint | number
}

/** A proposal block to sign, so that another account submits it. */
export interface SignedBlockProposalInput extends SignedProposalActionInput {
  /** Why the proposal is blocked. */
  reason: string
}

/**
 * One call a proposal makes once adopted.
 *
 * @remarks Build it with `Procedure.createOperation()` rather than by hand.
 */
export interface ProcedureProposalOperation {
  /** Position in the proposal. */
  index: string
  /** Four-byte selector of the function called. */
  functionSelector: string
  /** Contract called. The zero address calls the procedure itself. */
  target?: string
  /** Encoded call. */
  data: string
  /** Ether sent with the call, in wei. */
  value?: string
  /** Whether the call has run. */
  processed?: boolean
  /** The function called, when it is a known one. */
  function?: ProcedureProposalOperationFunction
  /** Decoded parameters, to display them. */
  params?: OperationParam[]
  /** Explanation shown to the user. */
  description?: string
}

/** A proposal submitted to a procedure, and where it stands. */
export interface ProcedureProposal {
  /** Identifier of the proposal in its procedure. */
  key: string
  /** Address that submitted it. */
  creator: string
  /** Reference to its off-chain metadata. */
  cid: string
  /** Why a moderator blocked it. */
  blockReason: string
  /** Whether it reached the deciders, after moderation if enabled. */
  presented: boolean
  /** Whether a moderator blocked it. */
  blocked: boolean
  /** Whether the deciders adopted it. */
  adopted: boolean
  /** Whether it is settled: operations run if adopted, closed if rejected. */
  applied: boolean
  /** Calls made once adopted. */
  operations: ProcedureProposalOperation[]
  /** Hash of the transaction that submitted it. */
  transactionHash?: string
  /** Off-chain metadata, once loaded. */
  metadata?: ProposalMetadata
}

/** Reject malformed calls before a proposal can be persisted on-chain. */
export const assertValidProposalOperations = (
  operations: ProcedureProposalOperation[]
) => {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('A proposal must contain at least one valid operation.')
  }
  operations.forEach((operation, index) => {
    if (
      operation.target == null ||
      !isAddress(operation.target) ||
      operation.target.toLowerCase() === zeroAddress
    ) {
      throw new Error(
        `Operation ${index + 1} must target a non-zero contract address.`
      )
    }
    if (
      typeof operation.data !== 'string' ||
      !/^0x[\da-fA-F]{8,}$/.test(operation.data) ||
      operation.data.length % 2 !== 0
    ) {
      throw new Error(`Operation ${index + 1} must contain a contract call.`)
    }
    try {
      if (BigInt(operation.index) < 0n || BigInt(operation.value ?? '0') < 0n) {
        throw new Error('negative value')
      }
    } catch {
      throw new Error(`Operation ${index + 1} has an invalid index or value.`)
    }
  })
}

/**
 * The function an operation calls, as listed in `Procedure.OPERATIONS_FUNCTIONS`.
 */
export type OperationKey =
  | 'addEntries'
  | 'removeEntries'
  | 'replaceEntry'
  | 'addPermission'
  | 'removePermission'
  | 'replacePermission'
  | 'updateMetadata'
  | 'withdrawEther'
  | 'withdrawERC20'
  | 'withdrawERC721'
  | 'externalCall'
  | string

/** What a proposal says, stored off-chain: title, description and attachments. */
export interface ProposalMetadata {
  /** Title. */
  title: string
  /** Subtitle. */
  subtitle?: string
  /** Description. */
  description?: string
  /** Link to a discussion. */
  discussion?: string
  /** Attached file name. */
  file?: string
  /** Reference to an attached file. */
  cid?: string
}

/** The data of a procedure, deployed or still a draft. */
export interface ProcedureInput {
  /** Contract address, or a predicted address while it is a draft. */
  address?: string | null
  /** Organ whose members adopt or reject proposals, or a single address. */
  deciders: string
  /** Procedure type: `nomination`, `vote` or `erc20Vote`. */
  typeName: string
  /** Registered procedure type this procedure is a clone of. */
  type?: ProcedureType
  /** Display name. */
  name?: string | null
  /** Free description. */
  description?: string | null
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Chain the procedure lives on. */
  chainId?: string | null
  /** Reference to the off-chain metadata of the procedure. */
  cid?: string | null
  /** Client used for reads. */
  publicClient?: PublicClient | null
  /** Client that signs transactions. */
  walletClient?: WalletClient | null
  /** Off-chain metadata, as a JSON string. */
  metadata?: string | null
  /** Organ whose members may submit proposals, or a single address. */
  proposers?: string | null
  /** Whether proposals must be presented by a moderator before the decision. */
  withModeration?: boolean | null
  /** Whether proposers are organ members, token holders, or nobody. */
  proposerMode?: ERC20VoteRoleMode | null
  /** Whether moderators are organ members, token holders, or nobody. */
  moderatorMode?: ERC20VoteRoleMode | null
  /** Whether voters are organ members or token holders. */
  voterMode?: ERC20VoteRoleMode | null
  /**
   * Whether a majority of the deciders organ must also approve, besides the token-weighted vote.
   */
  requireMemberMajority?: boolean | null
  /**
   * Organ whose members may present or block proposals, when moderation is enabled.
   */
  moderators?: string | null
  /** Trusted forwarder relaying gasless transactions. */
  forwarder?: string | null
  /** Proposals submitted so far. */
  proposals?: ProcedureProposal[] | null
  /** Whether the contract exists on chain. */
  isDeployed?: boolean | null
  /** Organigram the procedure belongs to. */
  organigramId?: string | null
  /**
   * Parameters specific to the procedure type, as a JSON string, such as the vote duration.
   */
  data?: string | null
}

const normalizeProcedureData = (data: any): ProcedureContractData => ({
  cid: data.cid ?? data[0],
  proposers: data.proposers ?? data[1],
  moderators: data.moderators ?? data[2],
  deciders: data.deciders ?? data[3],
  withModeration: data.withModeration ?? data[4] ?? false,
  proposalsLength: BigInt(data.proposalsLength ?? data[5] ?? 0),
  interfaceId: data.interfaceId ?? data[6]
})

const normalizeTupleEntry = (value: any) => ({
  addr: value?.addr ?? value?.address ?? value?.[0],
  cid: value?.cid ?? value?.[1]
})

const normalizeProposal = (proposal: any, key: string): ProcedureProposal => ({
  key,
  creator: proposal.creator ?? proposal[0],
  cid: proposal.cid ?? proposal[1],
  blockReason: proposal.blockReason ?? proposal[2],
  presented: proposal.presented ?? proposal[3],
  blocked: proposal.blocked ?? proposal[4],
  adopted: proposal.adopted ?? proposal[5],
  applied: proposal.applied ?? proposal[6],
  operations: (proposal.operations ?? proposal[7] ?? []).map(
    (operation: unknown) => Procedure.parseOperation(operation)
  )
})

export const procedureFunctions: ProcedureProposalOperationFunction[] = [
  {
    funcSig: '0x4d3f8407',
    key: 'updateCid',
    signature: 'updateCid(string)',
    label: 'Update cid',
    tags: ['cid', 'replace'],
    params: ['cid'],
    target: 'organ'
  },
  {
    funcSig: '0xd610b570',
    key: 'addEntries',
    signature: 'addEntries(OrganLibrary.Entry[])',
    label: 'Add entries',
    tags: ['entries', 'add'],
    params: ['entries'],
    target: 'organ'
  },
  {
    funcSig: '0x7615eb81',
    key: 'removeEntries',
    signature: 'removeEntries(uint256[])',
    label: 'Remove entries',
    tags: ['entries', 'remove'],
    params: ['indexes'],
    target: 'organ'
  },
  {
    funcSig: '0x62f7f997',
    key: 'replaceEntry',
    signature: 'replaceEntry(uint256,CoreLibrary.Entry)',
    label: 'Replace entry',
    tags: ['entries', 'replace'],
    params: ['index', 'entry'],
    target: 'organ'
  },
  {
    funcSig: '0x7f0a4e27',
    key: 'addPermission',
    signature: 'addPermission(address,bytes2)',
    label: 'Add permission',
    tags: ['permissions', 'add'],
    params: ['permissionAddress', 'permissionValue'],
    target: 'organ'
  },
  {
    funcSig: '0x19b9404c',
    key: 'removePermission',
    signature: 'removePermission(address)',
    label: 'Remove permission',
    tags: ['permissions', 'remove'],
    params: ['permissionAddress'],
    target: 'organ'
  },
  {
    funcSig: '0xd0922d4a',
    key: 'replacePermission',
    signature: 'replacePermission(address,address,bytes2)',
    label: 'Replace permission',
    tags: ['permissions', 'replace'],
    params: ['oldPermissionAddress', 'newPermissionAddress', 'permissionValue'],
    target: 'organ'
  },
  {
    funcSig: toFunctionSelector('transferEther(address,uint256)'),
    key: 'withdrawEther',
    signature: 'transferEther(address,uint256)',
    label: 'Withdraw ether',
    tags: ['transfer', 'withdraw', 'ether'],
    params: ['address', 'amount'],
    target: 'organ'
  },
  {
    funcSig: '0xf49b5848',
    key: 'withdrawERC20',
    signature: 'transferCoins(address,address,address,uint256)',
    label: 'Withdraw ERC20',
    tags: ['transfer', 'withdraw', 'coins', 'erc20'],
    params: ['address', 'address', 'address', 'amount'],
    target: 'organ'
  },
  {
    funcSig: '0xbdb3e1c4',
    key: 'withdrawERC721',
    signature: 'transferCollectible(address,address,address,uint256)',
    label: 'Withdraw ERC721',
    tags: ['transfer', 'withdraw', 'collectibles', 'erc721'],
    params: ['address', 'address', 'address', 'tokenId'],
    target: 'organ'
  },
  {
    funcSig: toFunctionSelector('executeWhitelisted(address,uint256,bytes)'),
    key: 'externalCall',
    signature: 'executeWhitelisted(address,uint256,bytes)',
    label: 'External call',
    tags: ['transfer'],
    params: ['address', 'amount', 'bytes'],
    target: 'organ'
  },
  {
    funcSig: toFunctionSelector('transferEquity(address,address,uint256,string)'),
    key: 'transferEquity',
    signature: 'transferEquity(address,address,uint256,string)',
    label: 'Transfer equity asset',
    tags: ['transfer', 'erc20'],
    params: ['address', 'address', 'amount', 'cid'],
    target: 'self'
  }
]

/**
 * The rules by which the members of some organs may change other organs.
 *
 * @remarks A proposal is a list of operations. Proposers submit it with `propose()`. With moderation, a moderator presents it with `presentProposal()` or blocks it with `blockProposal()`. Deciders then adopt or reject it, depending on the procedure type, and adoption runs its operations.
 * Every action also has a signed variant (`sign…` then `…BySig`), so that a relayer submits it and users need no gas.
 */
export class Procedure {
  /** ERC-165 interface identifier of procedure contracts. */
  static INTERFACE = '0x71dbd330'

  /**
   * Functions a proposal operation can call, with what a form needs to build them.
   */
  static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[] =
    procedureFunctions

  /** Display name. */
  name: string
  /** Free description. */
  description: string
  /** Contract address, or a predicted address while it is a draft. */
  address: string
  /** Procedure type: `nomination`, `vote` or `erc20Vote`. */
  typeName: ProcedureTypeName
  /** Reference to the off-chain metadata of the procedure. */
  cid: string
  /** Whether the contract exists on chain. */
  isDeployed: boolean
  /** Organ whose members adopt or reject proposals, or a single address. */
  deciders: string
  /** Organ whose members may submit proposals, or a single address. */
  proposers: string
  /** Whether proposals must be presented by a moderator before the decision. */
  withModeration: boolean
  /**
   * Organ whose members may present or block proposals, when moderation is enabled.
   */
  moderators: string
  /** Off-chain metadata, as a JSON string. */
  metadata: string
  /**
   * Parameters specific to the procedure type, as a JSON string, such as the vote duration.
   */
  data: string
  /** Trusted forwarder relaying gasless transactions. */
  forwarder: string
  /** Proposals submitted so far. */
  proposals: ProcedureProposal[]
  /** viem contract instance, once loaded. */
  contract?: OrganigramContract
  /** Salt that determines the clone address. */
  salt?: string
  /** Chain the procedure lives on. */
  chainId: string
  /** Client that signs transactions. */
  walletClient?: WalletClient
  /** Client used for reads. */
  publicClient?: PublicClient
  /** Organigram the procedure belongs to. */
  organigramId: string
  /** Registered procedure type this procedure is a clone of. */
  type: ProcedureType

  constructor({
    address,
    deciders,
    typeName,
    name,
    description,
    salt,
    cid,
    chainId,
    publicClient,
    walletClient,
    metadata,
    proposers,
    withModeration,
    forwarder,
    moderators,
    proposals,
    isDeployed,
    type,
    data,
    organigramId,
  }: ProcedureInput) {
    if (typeName == null || deciders == null) {
      throw new Error(
        'typeName and deciders are required to create a procedure.'
      )
    }
    if (!(typeName in ProcedureTypeNameEnum)) {
      throw new Error(
        `typeName must be one of ${Object.values(ProcedureTypeNameEnum).join(', ')}.`
      )
    }
    this.salt = salt ?? (isDeployed ? undefined : createRandom32BytesHexId())
    this.address =
      address ??
      predictContractAddress({
        type: (capitalize(typeName) + 'Procedure') as 'NominationProcedure',
        chainId: chainId ?? getDefaultChainId(),
        salt: this.salt!
      })
    this.deciders = deciders
    this.typeName = typeName as ProcedureTypeName
    this.isDeployed = isDeployed ?? false
    this.cid = cid ?? this.typeName
    this.name = name ?? 'Unnamed procedure'
    this.description = description ?? ''
    this.chainId = chainId ?? getDefaultChainId()
    this.organigramId = organigramId ?? 'default-organigram-id'
    this.metadata = metadata ?? '{}'
    this.proposers = proposers ?? deciders
    this.moderators = moderators ?? zeroAddress
    this.withModeration = withModeration ?? false
    this.forwarder = forwarder ?? getDeployment(this.chainId, 'MetaGasStation')
    this.proposals = proposals ?? []
    this.walletClient = walletClient ?? undefined
    this.publicClient = publicClient ?? undefined
    this.contract =
      this.publicClient != null
        ? getContractInstance({
            address: this.address,
            abi: ProcedureContractABI.abi,
            publicClient: this.publicClient,
            walletClient: this.walletClient
          })
        : undefined
    this.type = type ?? getProcedureType(this.chainId, this.typeName)
    this.data = data ?? ''
  }

  /** The viem clients of the procedure. */
  protected getClients(): ContractClients {
    if (this.publicClient == null) {
      throw new Error('Public client not connected.')
    }
    return {
      publicClient: this.publicClient,
      walletClient: this.walletClient
    }
  }

  /** @internal */
  static async _populateInitialize(
    _populateInitializeInput: PopulateInitializeInput,
    _clients: ContractClients
  ): Promise<PopulatedTransactionData> {
    throw new Error('Procedure cannot be initialized.')
  }

  /** Read the roles, metadata reference and proposal count of a procedure. */
  static async loadData(
    address: string,
    clients: ContractClients
  ): Promise<ProcedureContractData> {
    const contract = getContractInstance({
      address,
      abi: ProcedureContractABI.abi,
      publicClient: clients.publicClient
    })
    return normalizeProcedureData(await contract.read.getProcedure())
  }

  /** Read one proposal of a procedure. */
  static async loadProposal(
    address: string,
    proposalKey: string,
    clients: ContractClients
  ): Promise<ProcedureProposal> {
    const contract = getContractInstance({
      address,
      abi: ProcedureContractABI.abi,
      publicClient: clients.publicClient
    })
    const proposal = await contract.read.getProposal([BigInt(proposalKey)])
    return normalizeProposal(proposal, proposalKey)
  }

  /** Read every proposal of a procedure. */
  static async loadProposals(
    address: string,
    clients: ContractClients,
    data?: ProcedureContractData
  ): Promise<ProcedureProposal[]> {
    const procedureData = data ?? (await Procedure.loadData(address, clients))
    const proposalsLength = Number(procedureData.proposalsLength)
    const multicallProposals = await tryMulticall(
      clients,
      Array.from({ length: proposalsLength }).map((_, index) => {
        const key = index.toString()
        return {
          target: address,
          callData: encodeFunctionData({
            abi: ProcedureContractABI.abi,
            functionName: 'getProposal',
            args: [BigInt(index)]
          }),
          decode: returnData =>
            normalizeProposal(
              decodeFunctionResult({
                abi: ProcedureContractABI.abi,
                functionName: 'getProposal',
                data: returnData
              }),
              key
            )
        }
      })
    )

    if (multicallProposals != null) {
      return multicallProposals.filter(
        (proposal): proposal is ProcedureProposal => proposal != null
      )
    }

    return (
      await Promise.all(
        Array.from({ length: proposalsLength }).map(async (_, index) => {
          const key = index.toString()
          return await Procedure.loadProposal(address, key, clients).catch(
            (error: Error) => {
              console.warn(
                'Error while loading proposal in procedure.',
                address,
                key,
                error.message
              )
              return null
            }
          )
        })
      )
    ).filter((proposal): proposal is ProcedureProposal => proposal != null)
  }

  /** Read a procedure from chain, with its proposals. */
  static async load(
    address: string,
    clients: ContractClients,
    initialProcedure?: ProcedureInput
  ): Promise<Procedure> {
    if (!address) {
      throw new Error('No address provided.')
    }
    const chainId =
      initialProcedure?.chainId ??
      String(await clients.publicClient.getChainId())
    if (initialProcedure?.typeName == null && initialProcedure?.type == null) {
      const isProcedure = await Procedure.isProcedure(address, clients)
      if (!isProcedure) {
        throw new Error('Contract at address is not a Procedure.')
      }
    }
    const data = await Procedure.loadData(address, clients)
    const proposals = await Procedure.loadProposals(address, clients, data)
    return new Procedure({
      ...initialProcedure,
      typeName: initialProcedure?.typeName ?? 'nomination',
      cid: data.cid,
      address,
      chainId,
      publicClient: clients.publicClient,
      walletClient: clients.walletClient,
      metadata: initialProcedure?.metadata ?? '{}',
      proposers: data.proposers,
      moderators: data.moderators,
      deciders: data.deciders,
      withModeration: data.withModeration,
      forwarder:
        initialProcedure?.forwarder ?? getDeployment(chainId, 'MetaGasStation'),
      proposals,
      isDeployed: true
    })
  }

  /** @internal */
  static _stringifyParamType(type: OperationParamType): string {
    switch (type) {
      case 'cid':
        return 'string'
      case 'index':
        return 'uint256'
      case 'indexes':
        return 'uint256[]'
      case 'permissionValue':
        return 'bytes2'
      case 'addresses':
        return 'address[]'
      case 'bytes':
        return 'bytes'
      case 'address':
      case 'organ':
      case 'permissionAddress':
      case 'oldPermissionAddress':
      case 'newPermissionAddress':
        return 'address'
      case 'proposal':
      case 'proposals':
        return 'uint256'
      case 'entry':
        return '(address,string)'
      case 'entries':
        return '(address,string)[]'
      case 'amount':
      case 'tokenId':
        return 'uint256'
      default:
        return 'uint256'
    }
  }

  /** @internal */
  static _extractParams(
    types: OperationParamType[],
    operation?: ProcedureProposalOperation
  ): OperationParam[] {
    if (operation?.data != null) {
      const decodedParams = decodeAbiParameters(
        parseAbiParameters(
          types.map(type => Procedure._stringifyParamType(type)).join(', ')
        ),
        `0x${operation.data.substring(10)}`
      )
      return types.map((type, index): OperationParam => {
        let value = decodedParams[index]
        switch (type) {
          case 'cid':
            value = value as string
            break
          case 'entry':
            value = normalizeTupleEntry(value)
            break
          case 'entries':
            value = (value as unknown[]).map(normalizeTupleEntry)
            break
          default:
        }
        return { type, value }
      })
    }
    return types.map(type => ({ type }))
  }

  /** Normalize an operation read from chain. */
  static parseOperation(rawOperation: unknown): ProcedureProposalOperation {
    const operationTuple = rawOperation as any
    const index = (operationTuple.index ?? operationTuple[0]).toString()
    const target = operationTuple.target ?? operationTuple[1]
    const data = (operationTuple.data ?? operationTuple[2]) as string
    const value = (operationTuple.value ?? operationTuple[3])?.toString()
    const processed = operationTuple.processed ?? operationTuple[4]
    const functionSelector = data.toString().slice(0, 10)
    const operation: ProcedureProposalOperation = {
      index,
      target,
      value,
      data,
      processed,
      functionSelector
    }
    operation.function = Procedure.OPERATIONS_FUNCTIONS.find(
      procedureFunction => procedureFunction.funcSig === functionSelector
    )
    if (operation.function == null) {
      return operation
    }
    operation.params =
      operation.function.params != null
        ? Procedure._extractParams(operation.function.params, operation)
        : []
    return operation
  }

  /** Tell whether a contract is a procedure. */
  static async isProcedure(
    address: string,
    clients: ContractClients
  ): Promise<boolean> {
    const contract = getContractInstance({
      address,
      abi: ProcedureContractABI.abi,
      publicClient: clients.publicClient
    })
    return Boolean(await contract.read.supportsInterface(['0x01ffc9a7']))
  }

  /**
   * Submit a proposal.
   *
   * @param input - Reference to the proposal metadata, which must be a CID reference, and its operations.
   */
  async propose(input: {
    cid: string
    operations: ProcedureProposalOperation[]
    options?: TransactionOptions
  }): Promise<ProcedureProposal> {
    if (input.cid.trim() === '') {
      throw new Error('A proposal must include its metadata reference.')
    }
    if (!isCidRef(input.cid)) {
      throw new Error(
        'A proposal metadata reference must be scoped to its workspace.'
      )
    }
    assertValidProposalOperations(input.operations)
    const publicClient = this.publicClient
    if (publicClient == null) throw new Error('Public client not connected.')
    await Promise.all(
      [
        ...new Set(
          input.operations.map(operation =>
            operation.target == null || operation.target === zeroAddress
              ? this.address
              : operation.target
          )
        )
      ].map(
        async target => {
          const code = await publicClient.getCode({
            address: target as `0x${string}`
          })
          if (code == null || code === '0x') {
            throw new Error(
              `Proposal operation target ${target} is not deployed.`
            )
          }
        }
      )
    )
    const currentProcedureData = await Procedure.loadData(
      this.address,
      this.getClients()
    )
    const ops = input.operations.map(operation => ({
      index:
        operation.index != null && operation.index !== ''
          ? BigInt(operation.index)
          : 0n,
      target: operation.target ?? zeroAddress,
      data: operation.data as `0x${string}`,
      value: BigInt(operation.value ?? '0'),
      processed: false
    }))
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'propose',
      args: [input.cid, ops],
      clients: this.getClients(),
      nonce: input.options?.nonce
    })
    input.options?.onTransaction?.(
      tx,
      `Create proposal with CID ${input.cid} on procedure ${this.address}`
    )
    const receipt = await tx.wait()
    const proposalKey = currentProcedureData.proposalsLength.toString()
    const proposal = await Procedure.loadProposal(
      this.address,
      proposalKey,
      this.getClients()
    )
    const proposalWithTransaction = {
      ...proposal,
      transactionHash: receipt.transactionHash
    }
    this.proposals.push(proposalWithTransaction)
    return proposalWithTransaction
  }

  /**
   * Sign a proposal, so that another account submits it with `proposeBySig()`.
   *
   * @remarks The signer pays no gas: any account can submit the signature with the matching `…BySig` method.
   */
  async signProposal(input: SignedProposalInput): Promise<string> {
    if (this.walletClient == null) {
      throw new Error('Connected wallet cannot sign typed data.')
    }
    const account = await getWalletAccount(this.walletClient)
    const ops = input.operations.map(operation => ({
      index:
        operation.index != null && operation.index !== ''
          ? BigInt(operation.index)
          : 0n,
      target: (operation.target ?? zeroAddress) as `0x${string}`,
      data: operation.data as `0x${string}`,
      value: BigInt(operation.value ?? '0')
    }))
    const operationTypeHash = keccak256(
      toHex('Operation(uint256 index,address target,bytes data,uint256 value)')
    )
    const operationHashes = ops.map(operation =>
      keccak256(
        encodeAbiParameters(
          parseAbiParameters(
            ['bytes32', 'uint256', 'address', 'bytes32', 'uint256'].join(', ')
          ),
          [
            operationTypeHash,
            operation.index,
            operation.target,
            keccak256(operation.data),
            operation.value
          ]
        )
      )
    )
    return await this.walletClient.signTypedData({
      account,
      domain: this.getTypedDataDomain(),
      primaryType: 'Proposal',
      types: {
        Operation: [
          { name: 'index', type: 'uint256' },
          { name: 'target', type: 'address' },
          { name: 'data', type: 'bytes' },
          { name: 'value', type: 'uint256' }
        ],
        Proposal: [
          { name: 'cid', type: 'string' },
          { name: 'operationsHash', type: 'bytes32' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      message: {
        cid: input.cid,
        operationsHash: keccak256(
          encodePacked(['bytes32[]'], [operationHashes])
        ),
        nonce: input.nonce,
        deadline: BigInt(input.deadline)
      }
    })
  }

  /** Sign the presentation of a proposal, for `presentProposalBySig()`. */
  async signPresentProposal(input: SignedProposalActionInput): Promise<string> {
    if (this.walletClient == null) {
      throw new Error('Connected wallet cannot sign typed data.')
    }
    const account = await getWalletAccount(this.walletClient)
    return await this.walletClient.signTypedData({
      account,
      domain: this.getTypedDataDomain(),
      primaryType: 'PresentProposal',
      types: {
        PresentProposal: [
          { name: 'proposalKey', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      message: {
        ...input,
        proposalKey: BigInt(input.proposalKey),
        deadline: BigInt(input.deadline)
      }
    })
  }

  /** Sign the block of a proposal, for `blockProposalBySig()`. */
  async signBlockProposal(input: SignedBlockProposalInput): Promise<string> {
    if (this.walletClient == null) {
      throw new Error('Connected wallet cannot sign typed data.')
    }
    const account = await getWalletAccount(this.walletClient)
    return await this.walletClient.signTypedData({
      account,
      domain: this.getTypedDataDomain(),
      primaryType: 'BlockProposal',
      types: {
        BlockProposal: [
          { name: 'proposalKey', type: 'uint256' },
          { name: 'reason', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      message: {
        ...input,
        proposalKey: BigInt(input.proposalKey),
        deadline: BigInt(input.deadline)
      }
    })
  }

  /** Sign the application of a proposal, for `applyProposalBySig()`. */
  async signApplyProposal(input: SignedProposalActionInput): Promise<string> {
    if (this.walletClient == null) {
      throw new Error('Connected wallet cannot sign typed data.')
    }
    const account = await getWalletAccount(this.walletClient)
    return await this.walletClient.signTypedData({
      account,
      domain: this.getTypedDataDomain(),
      primaryType: 'ApplyProposal',
      types: {
        ApplyProposal: [
          { name: 'proposalKey', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      message: {
        ...input,
        proposalKey: BigInt(input.proposalKey),
        deadline: BigInt(input.deadline)
      }
    })
  }

  /** Submit a proposal signed by another account. */
  async proposeBySig(
    input: SignedProposalInput & { signature: string }
  ): Promise<OrganigramTransaction> {
    const ops = input.operations.map(operation => ({
      index:
        operation.index != null && operation.index !== ''
          ? BigInt(operation.index)
          : 0n,
      target: operation.target ?? zeroAddress,
      data: operation.data as `0x${string}`,
      value: BigInt(operation.value ?? '0'),
      processed: false
    }))
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'proposeBySig',
      args: [
        input.cid,
        ops,
        input.nonce,
        BigInt(input.deadline),
        input.signature
      ],
      clients: this.getClients()
    })
    await tx.wait()
    return tx
  }

  /** Read the next signature nonce of an account. */
  async getNonce(account: string): Promise<bigint> {
    const contract =
      this.contract ??
      getContractInstance({
        address: this.address,
        abi: ProcedureContractABI.abi,
        ...this.getClients()
      })
    return (await contract.read.getNonce([account])) as bigint
  }

  /** EIP-712 domain of the signatures of this procedure. */
  getTypedDataDomain(): {
    name: string
    version: string
    chainId: bigint
    verifyingContract: `0x${string}`
  } {
    return {
      name: 'Organigram Procedure',
      version: '1',
      chainId: BigInt(this.chainId),
      verifyingContract: this.address as `0x${string}`
    }
  }

  /**
   * Turn a contract call, such as the result of `Organ.populateTransaction()`,
   * into a proposal operation.
   */
  static createOperation({
    to,
    data,
    value = 0,
    index = 0
  }: {
    to: string
    data: string
    value?: number | string | bigint
    index?: number | string
  }): ProcedureProposalOperation {
    return {
      index: index.toString(),
      target: to,
      data,
      value: value.toString(),
      functionSelector: data.slice(0, 10)
    }
  }

  /**
   * Build an operation that makes an organ call a contract outside the organization.
   */
  static createExternalCallOperation({
    organAddress,
    target,
    data,
    value = 0,
    index = 0
  }: ExternalCallOperationInput): ProcedureProposalOperation {
    return Procedure.createOperation({
      to: organAddress,
      index,
      data: encodeFunctionData({
        abi: [
          {
            type: 'function',
            name: 'executeWhitelisted',
            stateMutability: 'nonpayable',
            inputs: [
              { name: 'target', type: 'address' },
              { name: 'value', type: 'uint256' },
              { name: 'data', type: 'bytes' }
            ],
            outputs: []
          }
        ],
        functionName: 'executeWhitelisted',
        args: [target as `0x${string}`, BigInt(value), data as `0x${string}`]
      })
    })
  }

  /** Block a proposal as a moderator, before its decision. */
  async blockProposal(
    proposalKey: string,
    reason: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'blockProposal',
      args: [BigInt(proposalKey), reason],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Block proposal ${proposalKey} of procedure ${this.address}`
    )
    return await tx.wait()
  }

  /** Block a proposal signed by a moderator. */
  async blockProposalBySig(
    input: SignedBlockProposalInput & { signature: string },
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'blockProposalBySig',
      args: [
        BigInt(input.proposalKey),
        input.reason,
        input.nonce,
        BigInt(input.deadline),
        input.signature
      ],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Block proposal ${input.proposalKey} of procedure ${this.address} by signature`
    )
    return await tx.wait()
  }

  /** Present a proposal to the deciders, as a moderator. */
  async presentProposal(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'presentProposal',
      args: [BigInt(proposalKey)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Present proposal ${proposalKey} of procedure ${this.address}`
    )
    return await tx.wait()
  }

  /** Present a proposal signed by a moderator. */
  async presentProposalBySig(
    input: SignedProposalActionInput & { signature: string },
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'presentProposalBySig',
      args: [
        BigInt(input.proposalKey),
        input.nonce,
        BigInt(input.deadline),
        input.signature
      ],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Present proposal ${input.proposalKey} of procedure ${this.address} by signature`
    )
    return await tx.wait()
  }

  /**
   * Settle a proposal: for a vote, count the ballots once it is over, then run or close it.
   */
  async applyProposal(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'applyProposal',
      args: [BigInt(proposalKey)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Apply proposal ${proposalKey} of procedure ${this.address}`
    )
    return await tx.wait()
  }

  /** Settle a proposal, with an application signed by another account. */
  async applyProposalBySig(
    input: SignedProposalActionInput & { signature: string },
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'applyProposalBySig',
      args: [
        BigInt(input.proposalKey),
        input.nonce,
        BigInt(input.deadline),
        input.signature
      ],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Apply proposal ${input.proposalKey} of procedure ${this.address} by signature`
    )
    return await tx.wait()
  }

  /** Read every proposal again from chain. */
  async reloadProposals(): Promise<Procedure> {
    this.proposals = await Procedure.loadProposals(
      this.address,
      this.getClients()
    )
    return this
  }

  /** Read one proposal again from chain. */
  async reloadProposal(proposalKey: string): Promise<Procedure> {
    const proposal = await Procedure.loadProposal(
      this.address,
      proposalKey,
      this.getClients()
    )
    this.proposals = this.proposals.map(existingProposal =>
      existingProposal.key === proposalKey ? proposal : existingProposal
    )
    return this
  }

  /** Read the roles and metadata reference again from chain. */
  async reloadData(): Promise<Procedure> {
    const data = await Procedure.loadData(this.address, this.getClients())
    this.cid = data.cid
    this.proposers = data.proposers
    this.moderators = data.moderators
    this.deciders = data.deciders
    this.withModeration = data.withModeration
    return this
  }

  /** Convert the procedure into plain JSON. */
  toJson = (): ProcedureJson =>
    JSON.parse(
      JSON.stringify(
        {
          address: this.address,
          salt: this.salt,
          organigramId: this.organigramId,
          chainId: this.chainId,
          data: this.data,
          typeName: this.typeName,
          name: this.name,
          description: this.description,
          cid: this.cid,
          isDeployed: this.isDeployed,
          deciders: this.deciders,
          proposers: this.proposers,
          moderators: this.moderators ?? zeroAddress,
          withModeration: this.withModeration,
          forwarder: this.forwarder,
          metadata: this.metadata,
          proposals: this.proposals,
          type: this.type
        },
        handleJsonBigInt
      )
    )
}
