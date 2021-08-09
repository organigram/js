import ProcedureContract from '@organigram/contracts/build/contracts/Procedure.json'
import { web3, getAccount } from './web3'
import { cidToMultihash, multihashToCid, CID } from './ipfs'
import Web3 from 'web3'
import type { Address, Metadata } from './types'

export type OperationTag = "metadata"
  | "entries"
  | "procedures"
  | "coins"
  | "collectibles"
  | "funds"
  | "add"
  | "replace"
  | "remove"
  | "deposit"
  | "withdraw"
  | "transfer"

export type OperationParamType = "metadata"
  | "entry"
  | "entries"
  | "address"
  | "addresses"
  | "index"
  | "indexes"
  | "organ"
  | "procedure"
  | "permissions"
  | "proposal"
  | "proposals"

export type OperationParamAction = "select"
  | "create"
  | "update"
  | "delete"
  | "withdraw"
  | "deposit"
  | "transfer"
  | "block"

export interface OperationParam {
  type: string
  action?: OperationParamAction   // Used to generate form UI.
  value?: any         // Used to display an operation
  parser?: Function   // Used to parse a submitted form
}

export interface ProcedureProposalOperationFunction {
  funcSig: string,
  key: string,
  signature?: string,
  label?: string,
  tags?: OperationTag[]
  params?: OperationParamType[]
  abi?: any
  target?: "organ" | "self"
}

export interface ProcedureProposalOperation {
  index: string
  functionSelector: string
  organ?: Address
  data: string
  value?: string
  processed?: boolean
  function?: ProcedureProposalOperationFunction
  params?: OperationParam[]
  userIsInOrgan?: boolean
  userIsInEntry?: boolean
  // @todo : generate a text from operation params.
  description?: any
}

export interface ProcedureProposal {
  key: string
  creator: Address
  metadata: Metadata
  blockReason: Metadata
  presented: boolean
  blocked: boolean
  adopted: boolean
  applied: boolean
  operations: ProcedureProposalOperation[]
}

export default class Procedure {
  static INTERFACE = `0x71dbd330` // Procedure.INTERFACE_ID
  static OPERATIONS_PARAMS_TYPES = [
    "metadata",
    "index",
    "indexes",
    "permissions",
    "addresses",
    "address",
    "organ",
    "procedure",
    "proposal",
    "proposals",
    "entry",
    "entries"
  ]
  // @todo : Implement a registry.
  static OPERATIONS_FUNCTIONS: ProcedureProposalOperationFunction[] = [
    {
      funcSig: "0x4d3f8407",
      key: "updateMetadata",
      signature: "updateMetadata(CoreLibrary.Metadata)",
      label: "Update metadata",
      tags: ["metadata", "replace"],
      params: ['metadata'],
      target: 'organ'
    },
    {
      funcSig: "0xbbc56af9",
      key: "addEntries",
      signature: "addEntries(OrganLibrary.Entry[])",
      label: "Add entries",
      tags: ["entries", "add"],
      params: ['entries'],
      target: 'organ'
    },
    {
      funcSig: "0x7615eb81",
      key: "removeEntries",
      signature: "removeEntries(uint256[])",
      label: "Remove entries",
      tags: ["entries", "remove"],
      params: ['indexes'],
      target: 'organ'
    },
    {
      funcSig: "0x91bdfe63",
      key: "replaceEntry",
      signature: "replaceEntry(uint256,CoreLibrary.Entry)",
      label: "Replace entry",
      tags: ["entries", "replace"],
      params: ['index', 'entry'],
      target: 'organ'
    },
    {
      funcSig: "0x7f0a4e27",
      key: "addProcedure",
      signature: "addProcedure(address,bytes2)",
      label: "Add procedure",
      tags: ["procedures", "add"],
      params: ['procedure', 'permissions'],
      target: 'organ'
    },
    {
      funcSig: "0x19b9404c",
      key: "removeProcedure",
      signature: "removeProcedure(address)",
      label: "Remove procedure",
      tags: ["procedures", "remove"],
      params: ['procedure'],
      target: 'organ'
    },
    {
      funcSig: "0xd0922d4a",
      key: "replaceProcedure",
      signature: "replaceProcedure(address,address,bytes2)",
      label: "Replace procedure",
      tags: ["procedures", "replace"],
      params: ['procedure', 'procedure', 'permissions'],
      target: 'organ'
    }
  ]
  _contract: any
  address: Address
  metadata: Metadata
  proposers: Address
  moderators: Address
  deciders: Address
  withModeration: boolean
  proposals: ProcedureProposal[]

  constructor(
    address: Address,
    metadata: Metadata,
    proposers: Address,
    moderators: Address,
    deciders: Address,
    withModeration: boolean,
    proposals: ProcedureProposal[]
  ) {
    this.address = address
    // @ts-ignore
    this._contract = new web3.eth.Contract(ProcedureContract.abi, address)
    this.metadata = metadata
    this.proposers = proposers
    this.moderators = moderators
    this.deciders = deciders
    this.withModeration = withModeration
    this.proposals = proposals || []
  }

  static async initialize(
    _address: Address,
    _metadata: CID,
    _proposers: Address,
    _moderators: Address,
    _deciders: Address,
    _withModeration: boolean,
    ..._args: any[]
  ): Promise<void> {
    // @dev : initialize() must be overriden in procedure class.
    throw new Error("Procedure cannot be initialized.")
  }

  static async loadData(address: Address): Promise<{
    metadata: CID | undefined,
    proposers: Address,
    moderators: Address,
    deciders: Address,
    withModeration: boolean,
    proposalsLength: string
  }> {
    // @ts-ignore
    const contract = new web3.eth.Contract(ProcedureContract.abi, address)
    const data = await contract.methods.getProcedure().call()
    const metadata: CID | undefined = multihashToCid(data.metadata)
    return {
      metadata,
      proposers: data.proposers,
      moderators: data.moderators,
      deciders: data.deciders,
      withModeration: data.withModeration,
      proposalsLength: data.proposalsLength
    }
  }

  static async loadProposal(
    address: Address,
    proposalKey: string
  ): Promise<ProcedureProposal> {
    // @ts-ignore
    const contract = new web3.eth.Contract(ProcedureContract.abi, address)
    const proposal = await contract.methods.getProposal(proposalKey).call()
    const metadata: Metadata = { cid: multihashToCid(proposal.metadata) }
    const blockReason: Metadata = { cid: multihashToCid(proposal.blockReason) }
    const operations: ProcedureProposalOperation[] = proposal.operations.map(
      (op: any): ProcedureProposalOperation => Procedure.parseOperation(op)
    )
    return {
      key: proposalKey,
      creator: proposal.creator,
      metadata,
      blockReason,
      presented: proposal.presented,
      blocked: proposal.blocked,
      adopted: proposal.adopted,
      applied: proposal.applied,
      operations
    }
  }

  static async loadProposals(address: Address): Promise<ProcedureProposal[]> {
    const data = await Procedure.loadData(address)
    const proposalsLength = Web3.utils.toBN(data.proposalsLength)
    let proposals: ProcedureProposal[] = []
    const iGenerator = function* () {
      let i = Web3.utils.toBN("0")
      while (i.lt(proposalsLength)) {
        yield i
        i = i.addn(1)
      }
    }
    for await (let proposalKey of iGenerator()) {
      const key: string = proposalKey.toString()
      const proposal: ProcedureProposal | null = await Procedure.loadProposal(address, key)
        .catch((error: Error) => {
          console.warn("Error while loading proposal in procedure.", address, key, error.message)
          return null
        })
      if (proposal)
        proposals.push(proposal)
    }
    return proposals
  }

  static async load(address: Address): Promise<Procedure> {
    const isProcedure: boolean = await Procedure.isProcedure(address).catch(() => false)
    if (!isProcedure)
      throw new Error("Contract at address is not a Procedure.")
    const data = await Procedure.loadData(address)
    const metadata: Metadata = { cid: data?.metadata }
    const proposals: ProcedureProposal[] = await Procedure.loadProposals(address)
    return new Procedure(
      address,
      metadata,
      data.proposers,
      data.moderators,
      data.deciders,
      data.withModeration,
      proposals
    )
  }

  static _stringifyParamType(type: OperationParamType): string {
    switch (type) {
      case 'metadata': return "(bytes32,uint8,uint8)"
      case 'index': return "uint256"
      case 'indexes': return "uint256[]"
      case 'permissions': return "bytes2"
      case 'addresses': return "address[]"
      case 'address': return "address"
      case 'organ': return "address"
      case 'procedure': return "address"
      case 'proposal': return "uint256"
      case 'proposals': return "uint256"
      case 'entry': return "(address,(bytes32,uint8,uint8))"
      case 'entries': return "(address,(bytes32,uint8,uint8))[]"
      default: return ""
    }
  }

  // Extra options for params, and decode value.
  static _extractParams(
    types: OperationParamType[],
    operation?: ProcedureProposalOperation
  ): OperationParam[] {
    // Parse operation data if provided.
    if (operation && operation.data) {
      const typesArray = types.map(Procedure._stringifyParamType)
      const decodedParams = web3.eth.abi.decodeParameters(typesArray, `0x${operation.data.substr(10)}`)
      return types.map((type, index) => {
        let param: OperationParam = {
          type,
          value: decodedParams[index]
        }
        switch (param.type) {
          case 'metadata':
            param.value = multihashToCid({
              ipfsHash: param.value[0],
              hashFunction: param.value[1],
              hashSize: param.value[2]
            })
            break
          case 'entry':
            param.value = {
              addr: param.value[0],
              doc: multihashToCid({
                ipfsHash: param.value[1][0],
                hashFunction: param.value[1][1],
                hashSize: param.value[1][2]
              })
            }
            break
          case 'entries':
            param.value = param.value.map((e: any) => ({
              addr: e[0],
              doc: multihashToCid({
                ipfsHash: e[1][0],
                hashFunction: e[1][1],
                hashSize: e[1][2]
              })
            }))
            break
          default:
        }
        return param
      })
    }
    else {
      return types.map(type => ({ type }))
    }
  }

  static parseOperation(_operation: any): ProcedureProposalOperation {
    const [index, organ, data, value, processed] = _operation
    const functionSelector: string = data.toString().slice(0, 10)
    let operation: ProcedureProposalOperation = { index, organ, value, data, processed, functionSelector }
    operation.function = Procedure.OPERATIONS_FUNCTIONS.find(pof => pof.funcSig === functionSelector)
    if (!operation.function)
      return operation
    operation.params = operation.function.params && Procedure._extractParams(operation.function.params, operation)
    return operation
  }

  static async isProcedure(address: Address): Promise<boolean> {
    // @ts-ignore
    const contract = new web3.eth.Contract(ProcedureContract.abi, address)
    const isERC165 = await contract.methods.supportsInterface("0x01ffc9a7").call()
      .catch(() => false)
    if (!isERC165) return false
    const isProcedure = await contract.methods.supportsInterface(Procedure.INTERFACE).call()
      .catch(() => false)
    return isProcedure
  }

  /**
   * Procedure API.
   */

  async updateMetadata(cid: CID): Promise<boolean> {
    const multihash = cidToMultihash(cid)
    if (!multihash)
      throw new Error("Wrong CID.")
    const from = await getAccount()
    return from && this._contract.methods.updateMetadata(multihash).send({ from })
      .then(() => true)
      .catch((error: Error) => {
        console.error("Error while updating metadata.", this.address, error.message)
        return false
      })
  }

  async updateAdmin(address: Address): Promise<boolean> {
    const from = await getAccount()
    return from && this._contract.methods.updateAdmin(address).send({ from })
      .then(() => true)
      .catch((error: Error) => {
        console.error("Error while updating admin.", this.address, error.message)
        return false
      })
  }

  async propose(
    metadata: CID,
    operations: ProcedureProposalOperation[]
  ): Promise<ProcedureProposal> {
    const from = await getAccount()
    const multihash = cidToMultihash(metadata)
    if (!multihash)
      throw new Error("Wrong CID.")
    const ops = operations.map(operation => {
      // Format operation for transaction call.
      return {
        index: operation.index || "0",
        organ: operation.organ,
        data: operation.data,
        value: operation.value,
        processed: false
      }
    })
    const proposalKey = await this._contract.methods.propose(multihash, ops).send({ from })
    if (!proposalKey)
      throw new Error("Proposal not created.")
    const proposal = await Procedure.loadProposal(this.address, proposalKey)
    if (!proposal)
      throw new Error("Proposal not found.")
    this.proposals.push(proposal)
    return proposal
  }

  async blockProposal(
    proposalKey: string,
    reason: CID
  ): Promise<any> {
    const from = await getAccount()
    const multihash = cidToMultihash(reason)
    if (!multihash)
      throw new Error("Wrong CID.")
    return this._contract.methods.blockProposal(proposalKey, multihash).send({ from })
  }

  async presentProposal(proposalKey: string): Promise<any> {
    const from = await getAccount()
    return from && this._contract.methods.presentProposal(proposalKey).send({ from })
      .catch((error: Error) => {
        console.error("Error while presenting proposal.", this.address, proposalKey, error.message)
        return false
      })
  }

  async applyProposal(proposalKey: string): Promise<any> {
    const from = await getAccount()
    return this._contract.methods.applyProposal(proposalKey).send({ from })
  }

  /**
   * Sync API.
   */

  async reloadProposals(): Promise<Procedure> {
    const proposals = await Procedure.loadProposals(this.address)
    this.proposals = proposals
    return this
  }

  async reloadProposal(proposalKey: string): Promise<Procedure> {
    const proposal = await Procedure.loadProposal(this.address, proposalKey)
    const proposals = this.proposals.map(m => m.key === proposalKey ? proposal : m)
    this.proposals = proposals
    return this
  }

  async reloadData(): Promise<Procedure> {
    const data = await Procedure.loadData(this.address)
    this.metadata.cid = data.metadata
    this.proposers = data.proposers
    this.moderators = data.moderators
    this.deciders = data.deciders
    this.withModeration = data.withModeration
    return this
  }
}