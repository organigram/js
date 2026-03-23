import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json'
import { type ContractTransactionReceipt, ethers } from 'ethers'

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
  PopulateInitializeInput,
  ProcedureTypeName,
  ProcedureTypeNameEnum,
  procedureTypes
} from './utils'

export interface ProcedureTypeField {
  name: string
  label: string
  description: string
  defaultValue: string
  type: any
}

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
  metadata?: string
  proposers: string
  moderators: string
  deciders: string
  withModeration: boolean
  forwarder: string
  proposalsLength: string
}

export type ProcedureJson = {
  isDeployed: boolean
  address: string
  deciders: string
  typeName: string
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

export type Election = {
  proposalKey: string
  start: string
  votesCount: string
  hasVoted: boolean
  approved?: boolean
}

// Is the connected account present the deciders/proposers/moderators organ?
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
  action?: OperationParamAction // Used to generate form UI.
  value?: unknown // Used to display an operation
  parser?: unknown // Used to parse a submitted form
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
  // @todo : generate a text from operation params.
  description?: string
}

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

export interface ProposalMetadata {
  title: string
  subtitle?: string
  description?: string
  discussion?: string
  file?: string
  cid?: string
}

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
  signerOrProvider?: ethers.Signer | ethers.Provider | null
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

// @todo : Generate this list from the ABI of the procedure contract.
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
    funcSig: ethers.id('executeWhitelisted(address,uint256,bytes)').slice(0, 10),
    key: 'externalCall',
    signature: 'executeWhitelisted(address,uint256,bytes)',
    label: 'External call',
    tags: ['transfer'],
    params: ['address', 'amount', 'bytes'],
    target: 'organ'
  }
]

export class Procedure {
  static INTERFACE = '0x71dbd330'

  // @todo : Implement a registry.
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
  _contract: ethers.Contract
  salt?: string
  chainId: string
  signer?: ethers.Signer
  provider?: ethers.Provider
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
    signerOrProvider,
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
        type: (capitalize(typeName!) + 'Procedure') as 'NominationProcedure',
        chainId: chainId ?? '11155111',
        salt: this.salt!
      })
    this.deciders = deciders
    this.typeName = typeName as 'nomination'
    this.isDeployed = isDeployed ?? false
    this.cid = cid ?? this.typeName
    this.name = name ?? 'Unnamed procedure'
    this.description = description ?? ''
    this.chainId = chainId ?? '11155111'
    this.organigramId = organigramId ?? 'default-organigram-id'
    this.metadata = metadata ?? '{}'
    this.proposers = proposers ?? deciders
    this.moderators = moderators ?? ethers.ZeroAddress
    this.withModeration = withModeration ?? false
    this.forwarder =
      forwarder ?? deployedAddresses[chainId as '11155111']?.MetaGasStation
    this.proposals = proposals ?? []
    if (signerOrProvider?.provider != null) {
      this.signer = signerOrProvider as ethers.Signer
      this.provider = this.signer.provider as ethers.Provider
    } else {
      this.provider = signerOrProvider as ethers.Provider
      this.signer = undefined
      try {
        if (this.provider instanceof ethers.JsonRpcProvider) {
          this.provider
            .getSigner(this.address)
            .then(signer => {
              this.signer = signer
            })
            .catch(error => {
              console.warn('Error while getting signer from provider.', error)
            })
        }
      } catch (error) {}
    }
    this._contract = new ethers.Contract(
      this.address,
      ProcedureContractABI.abi,
      signerOrProvider
    )
    this.type =
      type ?? procedureTypes[this.typeName as keyof typeof procedureTypes]
    this.data = data!
  }

  static async _populateInitialize(
    _populateInitializeInput: PopulateInitializeInput
  ): Promise<ethers.ContractTransaction> {
    // @dev : initialize() must be overriden in procedure class.
    throw new Error('Procedure cannot be initialized.')
  }

  static async loadData(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<ProcedureContractData> {
    const contract = new ethers.Contract(
      address,
      ProcedureContractABI.abi,
      signerOrProvider
    )
    return await contract.getProcedure()
  }

  static async loadProposal(
    address: string,
    proposalKey: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<ProcedureProposal> {
    const contract = new ethers.Contract(
      address,
      ProcedureContractABI.abi,
      signerOrProvider
    )
    const proposal = await contract.getProposal(proposalKey)
    const [creator, cid, blockReason, presented, blocked, adopted, applied] =
      proposal
    const parsedOperations: ProcedureProposalOperation[] =
      proposal.operations.map(
        (op: unknown): ProcedureProposalOperation =>
          Procedure.parseOperation(op)
      )
    return {
      key: proposalKey,
      creator,
      cid,
      blockReason,
      presented,
      blocked,
      adopted,
      applied,
      operations: parsedOperations
    }
  }

  static async loadProposals(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    data?: ProcedureContractData
  ): Promise<ProcedureProposal[]> {
    const procedureData =
      data ?? (await Procedure.loadData(address, signerOrProvider))
    const proposalsLength = Number(procedureData.proposalsLength)
    const contractInterface = new ethers.Interface(ProcedureContractABI.abi)
    const multicallProposals = await tryMulticall(
      signerOrProvider,
      Array.from({ length: proposalsLength }).map((_, i) => {
        const key = i.toString()
        return {
          target: address,
          callData: contractInterface.encodeFunctionData('getProposal', [key]),
          decode: returnData => {
            const [proposal] = contractInterface.decodeFunctionResult(
              'getProposal',
              returnData
            )
            const [
              creator,
              cid,
              blockReason,
              presented,
              blocked,
              adopted,
              applied
            ] = proposal
            return {
              key,
              creator,
              cid,
              blockReason,
              presented,
              blocked,
              adopted,
              applied,
              operations: proposal.operations.map((op: unknown) =>
                Procedure.parseOperation(op)
              )
            }
          }
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
        Array.from({ length: proposalsLength }).map(async (_, i) => {
          const key = i.toString()
          return await Procedure.loadProposal(
            address,
            key,
            signerOrProvider
          ).catch((error: Error) => {
            console.warn(
              'Error while loading proposal in procedure.',
              address,
              key,
              error.message
            )
            return null
          })
        })
      )
    ).filter(proposal => proposal != null)
  }

  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    initialProcedure?: ProcedureInput
  ): Promise<Procedure> {
    const provider =
      signerOrProvider.provider ?? (signerOrProvider as ethers.Provider)
    if (provider == null) {
      throw new Error('No provider found.')
    }
    if (!address) {
      throw new Error('No address provided.')
    }
    const chainId =
      initialProcedure?.chainId ??
      (await provider
        .getNetwork()
        .then(({ chainId }) => chainId.toString())
        .catch(_err => undefined))
    if (chainId == null) {
      throw new Error('No chainId found.')
    }
    if (initialProcedure?.typeName == null && initialProcedure?.type == null) {
      const isProcedure: boolean = await Procedure.isProcedure(
        address,
        signerOrProvider
      )
      if (!isProcedure) {
        throw new Error('Contract at address is not a Procedure.')
      }
    }
    const data = await Procedure.loadData(address, signerOrProvider)
    const proposals: ProcedureProposal[] = await Procedure.loadProposals(
      address,
      signerOrProvider,
      data
    )
    return new Procedure({
      ...initialProcedure,
      typeName: initialProcedure?.typeName ?? 'nomination',
      cid: data.cid,
      address,
      chainId,
      signerOrProvider,
      metadata: data.metadata,
      proposers: data.proposers,
      moderators: data.moderators,
      deciders: data.deciders,
      withModeration: data.withModeration,
      forwarder:
        data.forwarder ??
        deployedAddresses[chainId as '11155111']?.MetaGasStation,
      proposals
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
        return 'address'
      case 'organ':
        return 'address'
      case 'permissionAddress':
        return 'address'
      case 'oldPermissionAddress':
        return 'address'
      case 'newPermissionAddress':
        return 'address'
      case 'proposal':
        return 'uint256'
      case 'proposals':
        return 'uint256'
      case 'entry':
        return '(address,string)'
      case 'entries':
        return '(address,string)[]'
      case 'amount':
        return 'uint256'
      case 'tokenId':
        return 'uint256'
      default:
        return 'uint256'
    }
  }

  // Extra options for params, and decode value.
  static _extractParams(
    types: OperationParamType[],
    operation?: ProcedureProposalOperation
  ): OperationParam[] {
    // Parse operation data if provided.
    if (operation?.data != null) {
      const typesArray = types.map(type => Procedure._stringifyParamType(type))
      const decoder = ethers.AbiCoder.defaultAbiCoder()
      const decodedParams = decoder.decode(
        typesArray,
        `0x${operation.data.substring(10)}`
      )
      return types.map((type, index): OperationParam => {
        let _value
        // @todo Avoid Generic Injection Sink when using index like this.
        let value = decodedParams[index]
        if (value != null && type != null) {
          switch (type) {
            case 'cid':
              _value = value as [string]
              value = _value[0]
              break
            case 'entry':
              _value = value as [string, string]
              value = {
                addr: _value[0],
                cid: _value[1]
              }
              break
            case 'entries':
              _value = value as [[string, string]]
              value = _value.map(e => ({
                addr: e[0],
                cid: e[1]
              }))
              break
            default:
          }
        }
        return { type, value }
      })
    } else {
      return types.map(type => ({ type }))
    }
  }

  static parseOperation(_operation: unknown): ProcedureProposalOperation {
    const [index, target, data, value, processed] = _operation as [
      string,
      string,
      string,
      string,
      boolean
    ]
    const functionSelector: string = data.toString().slice(0, 10)
    const operation: ProcedureProposalOperation = {
      index,
      target,
      value,
      data,
      processed,
      functionSelector
    }
    operation.function = Procedure.OPERATIONS_FUNCTIONS.find(
      pof => pof.funcSig === functionSelector
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
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<boolean> {
    const contract = new ethers.Contract(
      address,
      ProcedureContractABI.abi,
      signerOrProvider
    )
    const isERC165: boolean = await contract.supportsInterface('0x01ffc9a7')
    if (!isERC165) return false
    return true // contract.supportsInterface(Procedure.INTERFACE)
  }

  /**
   * Procedure API.
   */

  async updateCid(
    cid: string,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> {
    const tx = await this._contract.updateCid(cid)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Update metadata of procedure ${
          this.address
        } with CID ${cid.toString()}`
      )
    }
    return tx
  }

  async updateAdmin(
    address: string,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> {
    const tx = await this._contract.updateAdmin(address)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Update admin of procedure ${this.address} to ${address}.`
      )
    }
    return tx
  }

  async propose(input: {
    cid: string
    operations: ProcedureProposalOperation[]
    options?: TransactionOptions
  }): Promise<ProcedureProposal> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const ops = input.operations.map(operation => {
      // Format operation for transaction call.
      return {
        index:
          operation?.index != null && operation.index !== ''
            ? operation.index
            : '0',
        target: operation.target,
        data: operation.data,
        value: operation.value,
        processed: false
      }
    })
    const tx = await this._contract.propose(input.cid, ops)
    if (input.options?.onTransaction != null) {
      input.options.onTransaction(
        tx,
        `Create proposal with CID ${input.cid} on procedure ${this.address}`
      )
    }
    const receipt = await tx.wait()
    const proposalKey: string = receipt.logs[0].topics[2]
    if (proposalKey == null || proposalKey === '') {
      throw new Error('Proposal not created.')
    }
    const proposal = await Procedure.loadProposal(
      this.address,
      proposalKey,
      signerOrProvider
    )
    if (proposal == null) {
      throw new Error('Proposal not found.')
    }
    this.proposals.push(proposal)
    return proposal
  }

  async signProposal(input: SignedProposalInput): Promise<string> {
    if (this.signer?.signTypedData == null) {
      throw new Error('Connected signer cannot sign typed data.')
    }
    const ops = input.operations.map(operation => ({
      index:
        operation?.index != null && operation.index !== ''
          ? operation.index
          : '0',
      target: operation.target,
      data: operation.data,
      value: operation.value ?? '0'
    }))
    return await this.signer.signTypedData(
      this.getTypedDataDomain(),
      {
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
      {
        cid: input.cid,
        operationsHash: ethers.solidityPackedKeccak256(
          ['bytes32[]'],
          [
            ops.map(operation =>
              ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                  ['bytes32', 'uint256', 'address', 'bytes32', 'uint256'],
                  [
                    ethers.id(
                      'Operation(uint256 index,address target,bytes data,uint256 value)'
                    ),
                    operation.index,
                    operation.target,
                    ethers.keccak256(operation.data),
                    operation.value
                  ]
                )
              )
            )
          ]
        ),
        nonce: input.nonce,
        deadline: input.deadline
      }
    )
  }

  async proposeBySig(input: SignedProposalInput & { signature: string }) {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const ops = input.operations.map(operation => ({
      index:
        operation?.index != null && operation.index !== ''
          ? operation.index
          : '0',
      target: operation.target,
      data: operation.data,
      value: operation.value ?? '0',
      processed: false
    }))
    const tx = await this._contract.proposeBySig(
      input.cid,
      ops,
      input.nonce,
      input.deadline,
      input.signature
    )
    await tx.wait()
    return tx
  }

  async getNonce(account: string): Promise<bigint> {
    return await this._contract.getNonce(account)
  }

  getTypedDataDomain(): {
    name: string
    version: string
    chainId: bigint
    verifyingContract: string
  } {
    return {
      name: 'Organigram Procedure',
      version: '1',
      chainId: BigInt(this.chainId),
      verifyingContract: this.address
    }
  }

  static createExternalCallOperation({
    organAddress,
    target,
    data,
    value = 0,
    index = 0
  }: ExternalCallOperationInput): ProcedureProposalOperation {
    const organInterface = new ethers.Interface([
      'function executeWhitelisted(address target,uint256 value,bytes data)'
    ])
    return {
      index: index.toString(),
      target: organAddress,
      value: '0',
      data: organInterface.encodeFunctionData('executeWhitelisted', [
        target,
        value,
        data
      ]),
      functionSelector: ethers
        .id('executeWhitelisted(address,uint256,bytes)')
        .slice(0, 10)
    }
  }

  async blockProposal(
    proposalKey: string,
    reason: string,
    options?: TransactionOptions
  ): Promise<ContractTransactionReceipt> {
    const tx = await this._contract.blockProposal(proposalKey, reason)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Block proposal ${proposalKey} of procedure ${this.address}`
      )
    }
    return await tx.wait()
  }

  async presentProposal(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<ContractTransactionReceipt> {
    const tx = await this._contract.presentProposal(proposalKey)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Present proposal ${proposalKey} of procedure ${this.address}`
      )
    }
    return await tx.wait()
  }

  async adoptProposal(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<ContractTransactionReceipt> {
    const tx = await this._contract.adoptProposal(proposalKey)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Adopt proposal ${proposalKey} of procedure ${this.address}`
      )
    }
    return await tx.wait()
  }

  async applyProposal(
    proposalKey: string,
    options?: TransactionOptions
  ): Promise<ContractTransactionReceipt> {
    const tx = await this._contract.applyProposal(proposalKey)
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Apply proposal ${proposalKey} of procedure ${this.address}`
      )
    }
    return await tx.wait()
  }

  /**
   * Sync API.
   */

  async reloadProposals(): Promise<Procedure> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const proposals = await Procedure.loadProposals(
      this.address,
      signerOrProvider
    )
    this.proposals = proposals
    return this
  }

  async reloadProposal(proposalKey: string): Promise<Procedure> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const proposal = await Procedure.loadProposal(
      this.address,
      proposalKey,
      signerOrProvider
    )
    const proposals = this.proposals.map(m =>
      m.key === proposalKey ? proposal : m
    )
    this.proposals = proposals
    return this
  }

  async reloadData(): Promise<Procedure> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const data = await Procedure.loadData(this.address, signerOrProvider)
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
          chainId: this.chainId!,
          data: this.data,
          typeName: this.typeName,
          name: this.name,
          description: this.description,
          cid: this.cid,
          isDeployed: this.isDeployed,
          deciders: this.deciders,
          proposers: this.proposers,
          moderators: this.moderators ?? ethers.ZeroAddress,
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
