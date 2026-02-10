import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json'
import { type ContractTransactionReceipt, ethers } from 'ethers'

import type { TransactionOptions } from '../organigramClient'
import {
  capitalize,
  createRandom32BytesHexId,
  deployedAddresses,
  predictContractAddress
} from '../utils'
import { SourceOrgan, TargetOrgan } from '../organigram'

export const procedureMetadata = {
  _type: 'procedureType',
  _generator: 'https://organigram.ai',
  _generatedAt: 0
}

export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote'
export enum ProcedureTypeNameEnum {
  erc20Vote = 'erc20Vote',
  nomination = 'nomination',
  vote = 'vote'
}

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
  sourceOrgans?: SourceOrgan[]
  targetOrgans?: TargetOrgan[]
  type: ProcedureType
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
  | 'procedures'
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
  | 'addresses'
  | 'index'
  | 'indexes'
  | 'organ'
  | 'procedure'
  | 'permissions'
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
  | 'addProcedure'
  | 'removeProcedure'
  | 'replaceProcedure'
  | 'updateMetadata'
  | 'transfer'
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
  sourceOrgans?: SourceOrgan[] | null
  targetOrgans?: TargetOrgan[] | null
  organigramId?: string | null
  data?: string | null
}

export interface PopulateInitializeInput {
  options?: {
    signer?: ethers.Signer
  } & TransactionOptions
  typeName?: ProcedureTypeName
  cid: string
  proposers: string
  moderators: string
  deciders: string
  withModeration: boolean
  forwarder: string
  args: unknown[]
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
    key: 'addProcedure',
    signature: 'addProcedure(address,bytes2)',
    label: 'Add permission',
    tags: ['procedures', 'add'],
    params: ['procedure', 'permissions'],
    target: 'organ'
  },
  {
    funcSig: '0x19b9404c',
    key: 'removeProcedure',
    signature: 'removeProcedure(address)',
    label: 'Remove permission',
    tags: ['procedures', 'remove'],
    params: ['procedure'],
    target: 'organ'
  },
  {
    funcSig: '0xd0922d4a',
    key: 'replaceProcedure',
    signature: 'replaceProcedure(address,address,bytes2)',
    label: 'Replace permission',
    tags: ['procedures', 'replace'],
    params: ['procedure', 'procedure', 'permissions'],
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

  sourceOrgans?: SourceOrgan[]
  targetOrgans?: TargetOrgan[]
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
    sourceOrgans,
    targetOrgans,
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
        chainId: chainId!,
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
    this.sourceOrgans = sourceOrgans ?? []
    this.targetOrgans = targetOrgans ?? []
    this.type = type!
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
  ): Promise<{
    cid: string
    metadata?: string
    proposers: string
    moderators: string
    deciders: string
    withModeration: boolean
    forwarder: string
    proposalsLength: string
  }> {
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
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<ProcedureProposal[]> {
    const data = await Procedure.loadData(address, signerOrProvider)
    const proposalsLength = BigInt(data.proposalsLength)
    const proposals: ProcedureProposal[] = []
    for (let i = 0; i < proposalsLength; i++) {
      const key: string = i.toString()
      const proposal: ProcedureProposal | null = await Procedure.loadProposal(
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
      if (proposal != null) {
        proposals.push(proposal)
      }
    }
    return proposals
  }

  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<Procedure> {
    const provider =
      signerOrProvider.provider ?? (signerOrProvider as ethers.Provider)
    if (provider == null) {
      throw new Error('No provider found.')
    }
    const chainId = await provider
      .getNetwork()
      .then(({ chainId }) => chainId.toString())
      .catch(_err => undefined)
    if (chainId == null) {
      throw new Error('No chainId found.')
    }
    const isProcedure: boolean = await Procedure.isProcedure(
      address,
      signerOrProvider
    )
    if (!isProcedure) {
      throw new Error('Contract at address is not a Procedure.')
    }
    const data = await Procedure.loadData(address, signerOrProvider)
    const proposals: ProcedureProposal[] = await Procedure.loadProposals(
      address,
      signerOrProvider
    )
    return new Procedure({
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
      proposals,
      isDeployed: true,
      typeName: 'nomination'
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
      case 'permissions':
        return 'bytes2'
      case 'addresses':
        return 'address[]'
      case 'address':
        return 'address'
      case 'organ':
        return 'address'
      case 'procedure':
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
    // @todo : Fix type or testing _operation as iterable.
    // @ts-expect-error How to check if _operation is iterable?
    const [index, target, data, value, processed] = _operation
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

  toJson(): ProcedureJson {
    return {
      chainId: this.chainId!,
      data: this.data,
      address: this.address,
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
      sourceOrgans: this.sourceOrgans,
      targetOrgans: this.targetOrgans,
      type: this.type
    }
  }
}
