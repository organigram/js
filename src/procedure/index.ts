import ProcedureContractABI from '@organigram/protocol/abi/Procedure.sol/Procedure.json' with { type: 'json' }
import {
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  keccak256,
  parseAbiParameters,
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
  deployedAddresses,
  handleJsonBigInt,
  predictContractAddress
} from '../utils'
import { tryMulticall } from '../multicall'
import {
  type PopulateInitializeInput,
  type PopulatedTransactionData,
  ProcedureTypeName,
  ProcedureTypeNameEnum,
  procedureTypes
} from './utils'
import {
  type ContractClients,
  type OrganigramTransaction,
  type OrganigramTransactionReceipt,
  createContractWriteTransaction,
  getContractInstance,
  getWalletAccount
} from '../contracts'

/**
 * Declarative description of one procedure configuration field.
 */
export interface ProcedureTypeField {
  name: string
  label: string
  description: string
  defaultValue: string
  type: any
}

/**
 * Metadata describing one registered procedure implementation.
 */
export interface ProcedureType {
  key: string
  address: string
  metadata: {
    cid?: string
    label?: string
    description?: string
  }
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

/**
 * JSON-safe serialized representation of one procedure.
 */
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
  forwarder: string
  proposals?: ProcedureProposal[]
  args?: unknown[]
  type: ProcedureType
  organigramId?: string | null
}

/**
 * Current election state for one vote-based proposal.
 */
export type Election = {
  proposalKey: string
  start: string
  votesCount: string
  hasVoted: boolean
  approved?: boolean
}

export type AccountInOrgans = {
  moderators?: boolean
  proposers?: boolean
  deciders?: boolean
}

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

export type OperationParamAction =
  | 'select'
  | 'create'
  | 'update'
  | 'delete'
  | 'withdraw'
  | 'deposit'
  | 'transfer'
  | 'block'

export interface OperationParam {
  type: OperationParamType
  action?: OperationParamAction
  value?: unknown
  parser?: unknown
}

export interface ProcedureProposalOperationFunction {
  funcSig: string
  key: ProposalKey
  signature?: string
  label?: string
  tags?: OperationTag[]
  params?: OperationParamType[]
  abi?: unknown
  target?: 'organ' | 'self'
}

export interface ExternalCallOperationInput {
  organAddress: string
  target: string
  data: string
  value?: string | bigint | number
  index?: string | number
}

export interface SignedProposalInput {
  cid: string
  operations: ProcedureProposalOperation[]
  nonce: bigint
  deadline: bigint | number
}

export interface SignedProposalActionInput {
  proposalKey: string
  nonce: bigint
  deadline: bigint | number
}

export interface SignedBlockProposalInput extends SignedProposalActionInput {
  reason: string
}

/**
 * One low-level operation bundled into a proposal.
 */
export interface ProcedureProposalOperation {
  index: string
  functionSelector: string
  target?: string
  data: string
  value?: string
  processed?: boolean
  function?: ProcedureProposalOperationFunction
  params?: OperationParam[]
  userIsInOrgan?: boolean
  userIsInEntry?: boolean
  description?: string
}

/**
 * Hydrated proposal state exposed by the SDK.
 */
export interface ProcedureProposal {
  key: ProposalKey
  creator: string
  cid: string
  blockReason: string
  presented: boolean
  blocked: boolean
  adopted: boolean
  applied: boolean
  operations: ProcedureProposalOperation[]
  metadata?: ProposalMetadata
}

export type ProposalKey =
  | 'addEntries'
  | 'removeEntries'
  | 'replaceEntry'
  | 'addPermission'
  | 'removePermission'
  | 'replacePermission'
  | 'updateMetadata'
  | 'transfer'
  | 'externalCall'
  | string

/**
 * Rich content attached to a proposal, usually stored off-chain.
 */
export interface ProposalMetadata {
  title: string
  subtitle?: string
  description?: string
  discussion?: string
  file?: string
  cid?: string
}

/**
 * Input used to create or hydrate a procedure model.
 */
export interface ProcedureInput {
  address?: string | null
  deciders: string
  typeName: string
  type?: ProcedureType
  name?: string | null
  description?: string | null
  salt?: string | null
  chainId?: string | null
  cid?: string | null
  publicClient?: PublicClient | null
  walletClient?: WalletClient | null
  metadata?: string | null
  proposers?: string | null
  withModeration?: boolean | null
  moderators?: string | null
  forwarder?: string | null
  proposals?: ProcedureProposal[] | null
  isDeployed?: boolean | null
  organigramId?: string | null
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
    funcSig: '0xa9059cbb',
    key: 'withdrawEther',
    signature: 'transfer(address,uint256)',
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
  }
]

/**
 * Base SDK model shared by every procedure implementation.
 */
export class Procedure {
  static INTERFACE = '0x71dbd330'

  static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[] =
    procedureFunctions

  name: string
  description: string
  address: string
  typeName: ProcedureTypeName
  cid: string
  isDeployed: boolean
  deciders: string
  proposers: string
  withModeration: boolean
  moderators: string
  metadata: string
  data: string
  forwarder: string
  proposals: ProcedureProposal[]
  contract?: any
  salt?: string
  chainId: string
  walletClient?: WalletClient
  publicClient?: PublicClient
  organigramId: string
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
    organigramId
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
        chainId: chainId ?? '11155111',
        salt: this.salt!
      })
    this.deciders = deciders
    this.typeName = typeName as ProcedureTypeName
    this.isDeployed = isDeployed ?? false
    this.cid = cid ?? this.typeName
    this.name = name ?? 'Unnamed procedure'
    this.description = description ?? ''
    this.chainId = chainId ?? '11155111'
    this.organigramId = organigramId ?? 'default-organigram-id'
    this.metadata = metadata ?? '{}'
    this.proposers = proposers ?? deciders
    this.moderators = moderators ?? zeroAddress
    this.withModeration = withModeration ?? false
    this.forwarder =
      forwarder ?? deployedAddresses[this.chainId as '11155111']?.MetaGasStation
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
    this.type =
      type ?? procedureTypes[this.typeName as keyof typeof procedureTypes]
    this.data = data ?? ''
  }

  protected getClients(): ContractClients {
    if (this.publicClient == null) {
      throw new Error('Public client not connected.')
    }
    return {
      publicClient: this.publicClient,
      walletClient: this.walletClient
    }
  }

  static async _populateInitialize(
    _populateInitializeInput: PopulateInitializeInput,
    _clients: ContractClients
  ): Promise<PopulatedTransactionData> {
    throw new Error('Procedure cannot be initialized.')
  }

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
        initialProcedure?.forwarder ??
        deployedAddresses[chainId as '11155111']?.MetaGasStation,
      proposals,
      isDeployed: true
    })
  }

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

  async updateCid(
    cid: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransaction> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'updateCid',
      args: [cid],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Update metadata of procedure ${this.address} with CID ${cid.toString()}`
    )
    return tx
  }

  async updateAdmin(
    address: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransaction> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: ProcedureContractABI.abi,
      functionName: 'updateAdmin',
      args: [address],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Update admin of procedure ${this.address} to ${address}.`
    )
    return tx
  }

  async propose(input: {
    cid: string
    operations: ProcedureProposalOperation[]
    options?: TransactionOptions
  }): Promise<ProcedureProposal> {
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
    await tx.wait()
    const proposalKey = currentProcedureData.proposalsLength.toString()
    const proposal = await Procedure.loadProposal(
      this.address,
      proposalKey,
      this.getClients()
    )
    this.proposals.push(proposal)
    return proposal
  }

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

  async getNonce(account: string): Promise<bigint> {
    const contract =
      this.contract ??
      getContractInstance({
        address: this.address,
        abi: ProcedureContractABI.abi,
        ...this.getClients()
      })
    return await contract.read.getNonce([account])
  }

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

  static createExternalCallOperation({
    organAddress,
    target,
    data,
    value = 0,
    index = 0
  }: ExternalCallOperationInput): ProcedureProposalOperation {
    return {
      index: index.toString(),
      target: organAddress,
      value: '0',
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
      }),
      functionSelector: toFunctionSelector(
        'executeWhitelisted(address,uint256,bytes)'
      )
    }
  }

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

  async reloadProposals(): Promise<Procedure> {
    this.proposals = await Procedure.loadProposals(
      this.address,
      this.getClients()
    )
    return this
  }

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

  async reloadData(): Promise<Procedure> {
    const data = await Procedure.loadData(this.address, this.getClients())
    this.cid = data.cid
    this.proposers = data.proposers
    this.moderators = data.moderators
    this.deciders = data.deciders
    this.withModeration = data.withModeration
    return this
  }

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
