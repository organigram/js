import OrganigramContract from '@organigram/contracts/build/contracts/Organigram.json'
import ProcedureContract from '@organigram/contracts/build/contracts/Procedure.json'
import { web3, getAccount, getNetwork } from './web3'
import Graph from './graph'
import Organ, { OrganEntry } from './organ'
import Procedure from './procedure'
import { parseJSON as cidToJSON, cidToMultihash, CID } from './ipfs'
import type { Address, Metadata, Network } from './types'

export type ProcedureType = {
  key: string,
  label: string,
  address: Address,
  metadata: Metadata,
  Class: any   // @dev : class should inherit from Procedure.
}

export type EnhancedProcedure = Procedure & {
  type: ProcedureType
}

export class Organigram {
  private _contract: any
  address: Address
  network: Network
  proceduresRegistry: Organ
  procedureTypes: ProcedureType[]
  organs: Organ[]
  procedures: EnhancedProcedure[]
  graphs: Graph[]

  constructor(
    address: Address,
    network: Network,
    proceduresRegistry: Organ,
    procedureTypes: ProcedureType[]
  ) {
    // @ts-ignore
    this._contract = new web3.eth.Contract(OrganigramContract.abi, address)
    this.address = address
    this.network = network
    this.proceduresRegistry = proceduresRegistry
    this.procedureTypes = procedureTypes
    this.organs = []
    this.procedures = []
    this.graphs = []
  }

  // Load a procedure type from the registry.
  static async loadProcedureType({ addr, doc }: { addr: Address, doc?: CID }): Promise<ProcedureType> {
    // @todo : Parse doc for custom parser.
    // @ts-ignore
    const contract = new web3.eth.Contract(ProcedureContract.abi, addr)
    let Class = null, label = "", key = "", metadata:any = {}
    // @todo : Leverage interfaces or metadata in registry to detect procedure class.
    if (!(await contract.methods.supportsInterface("0x01ffc9a7").call().catch(() => false)))
      throw new Error("Contract does not support interfaces.")
    if (!(await contract.methods.supportsInterface(Procedure.INTERFACE).call().catch(() => false)))
      throw new Error("Contract is not a procedure.")
    if (doc) {
      try {
        metadata = await cidToJSON(doc)
      } catch (error) {
        console.warn(error.message, doc)
      }
    }
    if (metadata?.type) {
      // @todo : Fix detection of built-in procedures types.
      switch (metadata.type) {
        case 'nomination':
        case 'vote':
        case 'erc20vote':
          key = metadata.type
          label = metadata.name || label
          Class = require(`@organigram/procedures/dist/${metadata.type}/class`)?.default
          break
        default:
      }
    }
    // @todo : If Class is set, test if addr supports the procedure's interface.
    return {
      label,
      key,
      address: addr,
      metadata: {
        ...metadata,
        cid: doc
      },
      Class
    }
  }

  static async loadProcedureTypes(address: Address): Promise<ProcedureType[]> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganigramContract.abi, address)
    const proceduresRegistry = await contract.methods.procedures().call()
    const procedures: OrganEntry[] = await Organ.loadEntries(proceduresRegistry)
    const procedureTypes: ProcedureType[] = await Promise.all(
      procedures.map((procedure) => Organigram.loadProcedureType({
        addr: procedure.address,
        doc: procedure.cid
      }))
    )
    return procedureTypes
  }

  static async load(address: Address): Promise<Organigram> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganigramContract.abi, address)
    const network = await getNetwork()
    const proceduresRegistryAddress = await contract.methods.procedures().call()
    const proceduresRegistry = await Organ.load(proceduresRegistryAddress)
    const procedureTypes: ProcedureType[] = await Organigram.loadProcedureTypes(address)
    return new Organigram(address, network, proceduresRegistry, procedureTypes)
  }

  // // @todo : Identify contract from on-chain function. 
  // public static async checkInterface(address:Address) {
  //     // @ts-ignore
  //     const contract = new web3.eth.Contract(Organigram.abi, address)
  //     return contract.checkInterface(interface, interface)
  // }

  /**
   * Instance API.
   */

  // Get master procedure data.
  async getProcedureType(address: Address): Promise<ProcedureType | null> {
    const code = await web3.eth.getCode(address)
    const type: Address = `0x${code.substr(22, 40)}`.toLowerCase()
    const procedureType = this.procedureTypes.find((pt: ProcedureType) => pt.address.toLowerCase() === type)
    return procedureType || null
  }

  // Get or load organ data.
  async getOrgan(address: Address, cached: boolean = true): Promise<Organ> {
    let organ = cached && this.organs.find(c => c.address === address)
    if (!organ)
      organ = await Organ.load(address)
    if (!organ)
      throw new Error("Organ not found.")
    this.organs.push(organ)
    return organ
  }

  // Get or load procedure data.
  async getProcedure(address: Address, cached: boolean = true): Promise<EnhancedProcedure> {
    const procedureType: ProcedureType | null = await this.getProcedureType(address)
    if (!procedureType) {
      throw new Error("Procedure not supported.")
    }
    let procedure = cached && this.procedures.find(c => c.address === address)
    if (!procedure) {
      procedure = await procedureType.Class.load(address)
        .catch((error:Error) => console.error(error.message))
    }
    if (!procedure) {
      throw new Error("Procedure not found.")
    }
    procedure.type = procedureType
    this.procedures.push(procedure)
    return procedure
  }

  // Get or load a contract.
  async getContract(address: Address, cached: boolean = true): Promise<Organ | EnhancedProcedure | null> {
    return (await Organ.isOrgan(address))
      ? this.getOrgan(address, cached)
      : (await Procedure.isProcedure(address))
        ? this.getProcedure(address, cached)
        : null
  }

  // Create and load an organ.
  async createOrgan(metadata: CID, admin?: Address): Promise<Organ> {
    const from = await getAccount()
    if (!admin) admin = from
    const multihash = cidToMultihash(metadata)
    const receipt = await this._contract.methods.createOrgan(admin, multihash).send({ from })
    const address = receipt?.events?.organCreated?.returnValues?.organ
    return this.getOrgan(address)
  }

  // Create and load a procedure.
  async createProcedure(
    type: Address,
    metadata: Metadata,
    proposers: Address,
    moderators: Address,
    deciders: Address,
    withModeration: boolean,
    ...args: any[]
  ): Promise<EnhancedProcedure> {
    const from = await getAccount()
    const procedureType = this.procedureTypes.find((pt: ProcedureType) => pt.address.toLowerCase() === type.toLowerCase())
    if (!procedureType?.address || !procedureType.Class)
      throw new Error("Procedure type not found.")
    const receipt = await this._contract.methods.createProcedure(procedureType.address).send({ from })
    const address = receipt?.events?.procedureCreated?.returnValues?.procedure
    try {
      await procedureType.Class.initialize(
        address,
        metadata,
        proposers,
        moderators,
        deciders,
        withModeration,
        // @ts-ignore
        ...args
      )
    } catch (error) {
      console.error(error.message)
      throw error
    }
    return this.getProcedure(address, false)
  }

  // Deploy a graph.
  public async deployGraph(graph: Graph): Promise<Graph> {
    // @todo : Return a reactive graph undergoing deployment.
    throw new Error("Not implemented.")
  }
}

export default Organigram