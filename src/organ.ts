import Web3 from 'web3'
import all from 'it-all'
import uint8ArrayConcat from 'uint8arrays/concat'
import OrganContract from '@organigram/contracts/build/contracts/Organ.json'
import {
  EMPTY_ADDRESS,
  web3,
  _linkBytecode,
  getAccount,
  getNetwork
} from './web3'
import { ipfsNode, multihashToCid, cidToMultihash, CID } from './ipfs'
import { Network, Address, Multihash, Metadata } from './types'

export const ORGAN_CONTRACT_SIGNATURES: string[] =
  OrganContract.ast.nodes
    .find(n => n.name === '')
    ?.nodes?.map(n => n?.functionSelector || '')
    .filter(i => i !== '') || []

export interface OrganEntry {
  index: string
  address: Address
  cid: CID | undefined
  data?: any // @todo : Check if Uint8Array could serve the purpose.
}

export interface OrganProcedure {
  address: Address
  permissions: number
}

export interface OrganData {
  address: string
  network: Network
  balance: string
  metadata: Metadata
  procedures: OrganProcedure[]
  entries: OrganEntry[]
}

export class Organ {
  static INTERFACE = `0xf81b1307` // Organ.INTERFACE_ID.
  address: string = ''
  network: Network = 'mainnet'
  balance: string = 'n/a'
  procedures: OrganProcedure[] = []
  metadata: Metadata
  entries: OrganEntry[] = []

  public constructor ({
    address,
    network,
    balance,
    procedures,
    metadata,
    entries
  }: OrganData) {
    this.address = address
    this.network = network
    this.balance = balance
    this.procedures = procedures
    this.metadata = metadata
    this.entries = entries
  }

  /* Organ API */

  public updateMetadata = async (
    cid: CID = CID.parse('QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH')
  ) => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const multihash = cidToMultihash(cid)
    if (!multihash) throw new Error('Wrong CID.')
    const { ipfsHash, hashFunction, hashSize } = multihash
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .updateMetadata({ ipfsHash, hashFunction, hashSize })
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while updating metadata.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public addEntries = async (entries: OrganEntry[]): Promise<Organ> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const _entries: {
      addr: Address
      doc: { ipfsHash: string; hashFunction: string; hashSize: string }
    }[] = entries.map(e => {
      let multihash = e.cid && cidToMultihash(e.cid)
      if (!multihash)
        throw new Error(`Wrong IPFS Content ID '${e.cid}' for entry.`)
      const { ipfsHash, hashFunction, hashSize } = multihash
      return { addr: e.address, doc: { ipfsHash, hashFunction, hashSize } }
    })
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .addEntries(_entries)
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while adding entries to organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public removeEntries = async (indexes: string[]): Promise<boolean> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .removeEntries(indexes)
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while removing entries in organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public replaceEntry = async (
    index: number,
    entry: OrganEntry
  ): Promise<Organ> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const multihash = entry.cid && cidToMultihash(entry.cid)
    if (!multihash) throw new Error('Wrong CID.')
    const { ipfsHash, hashFunction, hashSize } = multihash
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .replaceEntry(index, entry.address, {
          ipfsHash,
          hashFunction,
          hashSize
        })
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while replacing entry in organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public addProcedure = async (procedure: OrganProcedure): Promise<Organ> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const from = await getAccount()
    const permissions = `0x${(procedure.permissions || 0)
      .toString(16)
      .padStart(4, '0')}`
    return (
      from &&
      contract.methods
        .addProcedure(procedure.address, permissions)
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while adding procedures in organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public removeProcedure = async (procedure: Address): Promise<Organ> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .removeProcedure(procedure)
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while removing procedure in organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  public replaceProcedure = async (
    oldProcedure: Address,
    newOrganProcedure: OrganProcedure
  ): Promise<Organ> => {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, this.address)
    const permissions = `0x${(newOrganProcedure.permissions || 0)
      .toString(16)
      .padStart(4, '0')}`
    const from = await getAccount()
    return (
      from &&
      contract.methods
        .replaceProcedure(oldProcedure, newOrganProcedure.address, permissions)
        .send({ from })
        .then(() => true)
        .catch((error: Error) => {
          console.error(
            'Error while replacing procedure in organ.',
            this.address,
            error.message
          )
          return false
        })
    )
  }

  /* Static API */
  static async load (address: string): Promise<Organ> {
    const network = await getNetwork()
    if (!network) throw new Error('Not connected to a valid network.')
    const isOrgan: boolean = await Organ.isOrgan(address).catch(() => false)
    // if (!isOrgan)
    //     throw new Error("Contract at address is not an Organ.")
    const balance: string = await Organ.getBalance(address).catch(() => 'n/a')
    const organData = await Organ.loadData(address)
    const metadata: Metadata = { cid: organData?.metadata }
    const procedures: OrganProcedure[] = await Organ.loadProcedures(
      address
    ).catch(error => {
      console.warn(
        "Error while loading organ's procedures",
        address,
        error.message
      )
      return []
    })
    const entries = await Organ.loadEntries(address).catch(error => {
      console.warn(
        "Error while loading organ's entries",
        address,
        error.message
      )
      return []
    })
    return new Organ({
      address,
      network,
      balance,
      procedures,
      metadata,
      entries
    })
  }

  static async isOrgan (address: Address): Promise<boolean> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    const isERC165 = await contract.methods
      .supportsInterface('0x01ffc9a7')
      .call()
      .catch(() => false)
    if (!isERC165) return false
    const isOrgan = await contract.methods
      .supportsInterface(Organ.INTERFACE)
      .call()
      .catch(() => false)
    return isOrgan
  }

  static async getBalance (address: Address): Promise<string> {
    const balance = await web3.eth.getBalance(address)
    return `${balance}`
  }

  static async loadData (
    address: Address
  ): Promise<{
    metadata: CID | undefined
    proceduresLength: string
    entriesLength: string
    entriesCount: string
  }> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    const data = await contract.methods.getOrgan().call()
    const cid = multihashToCid(data.metadata)
    return {
      metadata: cid,
      proceduresLength: data?.proceduresLength,
      entriesLength: data?.entriesLength,
      entriesCount: data?.entriesCount
    }
  }

  static async loadEntryForAccount (
    address: Address,
    account: Address
  ): Promise<OrganEntry | null> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    const index = await contract.methods.getEntryIndexForAddress(account).call()
    return Organ.loadEntry(address, index)
  }

  static async loadPermissions (
    address: Address,
    procedure: Address
  ): Promise<any> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    return contract.methods
      .getPermissions(procedure)
      .call()
      .catch((e: Error) => console.error('Error', e.message))
      .then(({ perms }: any) => perms)
  }

  static async loadProcedure (
    address: Address,
    index: string
  ): Promise<OrganProcedure> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    return contract.methods
      .getProcedure(index)
      .call()
      .catch((e: Error) => console.error('Error', e.message))
      .then(
        (data: any) =>
          data && {
            address: data.addr,
            permissions: data.perms
          }
      )
  }

  static async loadProcedures (address: Address): Promise<OrganProcedure[]> {
    const data = await Organ.loadData(address)
    const length = Web3.utils.toBN(data.proceduresLength)
    let procedures: OrganProcedure[] = []
    const iGenerator = function * () {
      let i = Web3.utils.toBN('0')
      while (i.lt(length)) {
        yield i
        i = i.addn(1)
      }
    }
    for await (let i of iGenerator()) {
      const key: string = i.toString()
      const procedure: OrganProcedure | null = await Organ.loadProcedure(
        address,
        key
      ).catch((error: Error) => {
        console.warn(
          'Error while loading procedure in organ.',
          address,
          key,
          error.message
        )
        return null
      })
      if (procedure) procedures.push(procedure)
    }
    return procedures
  }

  static async loadEntry (
    address: Address,
    index: string
  ): Promise<OrganEntry> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    const ipfs = await ipfsNode
    if (!ipfs) {
      console.info('IPFS was not started. Starting IPFS.')
      await ipfs.start().catch((e: Error) => console.warn(e.message))
    }
    return contract.methods
      .getEntry(index)
      .call()
      .then(async ({ addr, doc }: { addr: Address; doc: Multihash }) => {
        if (
          addr === EMPTY_ADDRESS &&
          (!parseInt(doc.hashFunction, 16) || !parseInt(doc.hashSize))
        )
          return null
        let entry: OrganEntry = {
          index,
          address: addr,
          cid: multihashToCid(doc)
        }
        if (entry.cid) {
          try {
            // @ts-ignore
            entry.data = uint8ArrayConcat(await all(ipfs.cat(entry.cid)))
          } catch (error) {
            console.warn(
              'Error while loading data hash for entry.',
              address,
              index,
              error.message
            )
          }
        }
        return entry
      })
  }

  static async loadEntries (address: Address): Promise<OrganEntry[]> {
    const length = Web3.utils.toBN(
      (await Organ.loadData(address)).entriesLength
    )
    let entries: OrganEntry[] = []
    const iGenerator = function * () {
      // Entries indexes start at 1.
      let i = Web3.utils.toBN('1')
      while (i.lt(length)) {
        yield i
        i = i.addn(1)
      }
    }
    for await (let index of iGenerator()) {
      const key: string = index.toString()
      const entry: OrganEntry | null = await Organ.loadEntry(
        address,
        key
      ).catch((error: Error) => {
        console.warn(
          'Error while loading entry in organ.',
          address,
          key,
          error.message
        )
        return null
      })
      if (entry) entries.push(entry)
    }
    return entries
  }

  /**
   * Generate the encoded ABI with arguments, used for building Operations.
   * @todo: Update list of functionNames.
   */
  static async generateEncodedABI (
    address: Address,
    functionName:
      | 'addEntries'
      | 'removeEntries'
      | 'replaceEntry'
      | 'addProcedure'
      | 'removeProcedure'
      | 'replaceProcedure',
    ...args: any[]
  ): Promise<Request> {
    // @ts-ignore
    const contract = new web3.eth.Contract(OrganContract.abi, address)
    return contract?.methods?.[functionName]?.(...args)?.encodeABI?.()
  }

  /* Sync API */
  async reload (): Promise<Organ> {
    const { procedures, metadata, entries } = await Organ.load(this.address)
    this.metadata = metadata
    this.procedures = procedures
    this.entries = entries
    return this
  }

  async reloadEntries (): Promise<Organ> {
    this.entries = await Organ.loadEntries(this.address).catch(error => {
      console.warn(
        "Error while reloading organ's entries",
        this.address,
        error.message
      )
      return this.entries
    })
    return this
  }

  async reloadProcedures (): Promise<Organ> {
    this.procedures = await Organ.loadProcedures(this.address).catch(error => {
      console.warn(
        "Error while reloading organ's procedures",
        this.address,
        error.message
      )
      return this.procedures
    })
    return this
  }

  async reloadData (): Promise<Organ> {
    const data = await Organ.loadData(this.address)
    this.metadata.cid = data?.metadata
    return this
  }
}

// Organ permissions granted to procedures
export const PERMISSIONS = {
  ADMIN: 0xffff,
  ALL: 0x07ff,
  ALL_PROCEDURES: 0x0003,
  ALL_ENTRIES: 0x000c,
  ADD_PROCEDURES: 0x0001,
  REMOVE_PROCEDURES: 0x0002,
  ADD_ENTRIES: 0x0004,
  REMOVE_ENTRIES: 0x0008,
  UPDATE_METADATA: 0x0010,
  DEPOSIT_ETHER: 0x0020,
  WITHDRAW_ETHER: 0x0040,
  DEPOSIT_COINS: 0x0080,
  WITHDRAW_COINS: 0x0100,
  DEPOSIT_COLLECTIBLES: 0x0200,
  WITHDRAW_COLLECTIBLES: 0x0400
}

export const getPermissionsSet = (permissions: number): string[] =>
  Object && Object.entries && Object.entries(PERMISSIONS)
    .filter((permission: [string, number]) => (permissions & permission[1]) === permission[1])
    .map((permission: [string, number]) => permission[0])

export default Organ
