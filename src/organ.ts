import { ethers, type Signer } from 'ethers'
import OrganContractABI from '@organigram/protocol/artifacts/contracts/Organ.sol/Organ.json'

import { EMPTY_ADDRESS } from './utils'
import type { TransactionOptions } from './organigramClient'

export interface OrganEntry {
  index: string
  address: string
  cid: string
  // data?: unknown // @todo : Check if Uint8Array could serve the purpose.
}

export interface IOrganEntry {
  address?: string
  cid?: string
}
export interface OrganProcedure {
  address: string
  permissions: number
}

export interface OrganData {
  address: string
  chainId: string
  signerOrProvider: ethers.Signer | ethers.Provider
  balance: bigint
  cid: string
  procedures: OrganProcedure[]
  entries: OrganEntry[]
}

export enum OrganFunctionName {
  addEntries,
  removeEntries,
  replaceEntry,
  addProcedure,
  removeProcedure,
  replaceProcedure,
  withdrawEther,
  withdrawERC20,
  withdrawERC721
}

export class Organ {
  static INTERFACE = '0xf81b1307' // Organ.INTERFACE_ID.
  address: string
  chainId: string = '1'
  balance: bigint
  procedures: OrganProcedure[] = []
  cid: string
  entries: OrganEntry[] = []
  signer?: Signer
  provider?: ethers.Provider
  contract: ethers.Contract

  public constructor({
    address,
    chainId,
    signerOrProvider,
    balance,
    procedures,
    cid,
    entries
  }: OrganData) {
    this.address = address
    this.chainId = chainId
    this.balance = balance
    this.procedures = procedures
    this.cid = cid
    this.entries = entries
    if (signerOrProvider.provider != null) {
      this.signer = signerOrProvider as ethers.Signer
      this.provider = this.signer.provider as ethers.Provider
    } else if (signerOrProvider instanceof ethers.JsonRpcProvider) {
      this.provider = signerOrProvider
      signerOrProvider
        .getSigner()
        .then(signer => {
          this.signer = signer
        })
        .catch((error: Error) => {
          console.warn(
            'Error while getting signer from provider.',
            error.message
          )
        })
    }
    this.contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
  }

  /* Organ API */

  public updateCid = async (
    cid: string,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const tx = await this.contract.updateCid(cid, { nonce: options?.nonce })
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Update CID of organ ${this.address} to ${cid}.`
      )
    }
    return await tx.wait()
  }

  public addEntries = async (
    entries: IOrganEntry[],
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const _entries = entries
      .map(e => {
        if (
          (e.address == null || e.address === '') &&
          (e.cid == null || e.cid === '')
        ) {
          return undefined
        }
        return {
          addr: e.address ?? EMPTY_ADDRESS,
          cid: e.cid
        }
      })
      .filter(i => i != null)
    const tx = await this.contract.addEntries(_entries, {
      ...(options?.nonce != null ? { nonce: options.nonce } : {})
    })
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Add ${_entries.length} entries to organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public removeEntries = async (
    indexes: string[],
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const tx = await this.contract.removeEntries(indexes, {
      ...(options?.nonce != null ? { nonce: options.nonce } : {})
    })
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Remove ${indexes.length} entries from organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public replaceEntry = async (
    index: number,
    entry: OrganEntry,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const tx = await this.contract.replaceEntry(
      index,
      entry.address ?? '',
      entry.cid ?? '',
      { ...(options?.nonce != null ? { nonce: options.nonce } : {}) }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Replace entry ${index} of organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public addProcedure = async (
    procedure: OrganProcedure,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const permissions = `0x${procedure.permissions
      .toString(16)
      .padStart(4, '0')}`
    const tx = await this.contract.addProcedure(
      procedure.address,
      permissions,
      { ...(options?.nonce != null ? { nonce: options.nonce } : {}) }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Add procedure ${procedure.address} to organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public removeProcedure = async (
    procedure: string,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const tx = await this.contract.removeProcedure(procedure, {
      ...(options?.nonce != null ? { nonce: options.nonce } : {})
    })
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Remove procedure ${procedure} from organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public replaceProcedure = async (
    oldProcedure: string,
    newOrganProcedure: OrganProcedure,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const permissions = `0x${newOrganProcedure.permissions
      .toString(16)
      .padStart(4, '0')}`
    const tx = await this.contract.replaceProcedure(
      oldProcedure,
      newOrganProcedure.address,
      permissions,
      { ...(options?.nonce != null ? { nonce: options.nonce } : {}) }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Replace procedure ${oldProcedure} with ${newOrganProcedure.address} in organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  /* Static API */
  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<Organ> {
    const provider =
      signerOrProvider.provider ?? (signerOrProvider as ethers.Provider)
    const network =
      signerOrProvider.provider != null ? await provider?.getNetwork() : null
    const chainId = network?.chainId.toString() ?? '1'
    if (chainId == null) {
      throw new Error('No chainId found.')
    }
    // const isOrgan: boolean = await Organ.isOrgan(address, signerOrProvider)
    // if (!isOrgan) {
    //   throw new Error('Contract at address is not an Organ.')
    // }
    const data = await Organ.loadData(address, signerOrProvider)
    const balance = (await provider?.getBalance(address).catch(() => 0n)) ?? 0n
    const procedures: OrganProcedure[] = await Organ.loadProcedures(
      address,
      signerOrProvider
    )
    const entries = await Organ.loadEntries(address, signerOrProvider).catch(
      (error: Error) => {
        console.warn(error.message)
        return []
      }
    )

    return new Organ({
      address,
      chainId,
      signerOrProvider,
      balance,
      procedures,
      cid: data?.cid,
      entries
    })
  }

  static async isOrgan(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<boolean> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    const isERC165 = await contract.supportsInterface('0x01ffc9a7')
    if (isERC165 === false) return false
    return await contract.supportsInterface(Organ.INTERFACE)
  }

  static async getBalance(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<bigint> {
    const provider =
      signerOrProvider.provider ?? (signerOrProvider as ethers.Provider)
    const balance = provider?.getBalance(address)
    if (balance == null) return 0n
    return await balance
  }

  static async loadData(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<{
    cid: string
    proceduresLength: bigint
    entriesLength: bigint
    entriesCount: bigint
  }> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    return await contract.getOrgan().catch((e: Error) => {
      console.error(e.message)
    })
  }

  static async loadEntryForAccount(
    address: string,
    account: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganEntry | undefined> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    const index = await contract.getEntryIndexForAddress(account, {})
    return await Organ.loadEntry(address, index, signerOrProvider).catch(
      () => undefined
    )
  }

  static async loadPermissions(
    address: string,
    procedure: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<number> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    return await contract
      .getPermissions(procedure)
      .catch((e: Error) => {
        console.error('Error', e.message)
      })
      .then((res: { perms: string | number }) =>
        typeof res.perms === 'string' ? parseInt(res.perms, 16) : res.perms
      )
  }

  static async loadProcedure(
    address: string,
    index: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganProcedure> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    const procedure = await contract.getProcedure(index).catch((e: Error) => {
      console.error(e.message)
    })
    if (procedure == null) {
      throw new Error('Unable to load procedure.')
    }
    return {
      address: procedure.addr,
      permissions:
        typeof procedure.perms === 'string'
          ? parseInt(procedure.perms, 16)
          : procedure.perms
    }
  }

  static async loadProcedures(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganProcedure[]> {
    const data = await Organ.loadData(address, signerOrProvider)
    const procedures: OrganProcedure[] = []
    for (let i = 0n; i < data.proceduresLength; i++) {
      const procedure: OrganProcedure | null = await Organ.loadProcedure(
        address,
        i.toString(),
        signerOrProvider
      ).catch((error: Error) => {
        console.warn(
          'Error while loading procedure in organ.',
          address,
          i.toString(),
          error.message
        )
        return null
      })
      if (procedure != null) procedures.push(procedure)
    }
    return procedures
  }

  static async loadEntry(
    address: string,
    index: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganEntry> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    const entry = await contract.getEntry(index)
    return { index, address: entry.addr, cid: entry.cid }
  }

  static async loadEntries(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganEntry[]> {
    const length =
      (await Organ.loadData(address, signerOrProvider))?.entriesLength ?? 0n
    const entries = await Promise.all(
      Array.from({ length: parseInt(length.toString()) }).map(async (_, i) => {
        if (i !== 0) {
          const entry: OrganEntry | null = await Organ.loadEntry(
            address,
            i.toString(),
            signerOrProvider
          ).catch((error: Error) => {
            console.warn(
              'Error while loading entry in organ.',
              address,
              i.toString(),
              error.message
            )
            return null
          })
          if (entry != null && entry.address !== EMPTY_ADDRESS) {
            return entry
          }
        }
      })
    ).then(e => e.filter(i => i != null))
    return entries
  }

  /**
   * Generate the encoded ABI with arguments, used for building Operations.
   */
  static async populateTransaction(
    address: string,
    signer: ethers.Signer,
    functionName: OrganFunctionName,
    ...args: unknown[]
  ): Promise<ethers.ContractTransaction> {
    const contract = new ethers.Contract(address, OrganContractABI.abi, signer)
    return await contract[functionName.toString()].populateTransaction(...args)
  }

  /* Sync API */
  async reload(): Promise<Organ> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const { procedures, cid, entries } = await Organ.load(
      this.address,
      signerOrProvider
    )
    this.cid = cid
    this.procedures = procedures
    this.entries = entries
    return this
  }

  async reloadEntries(): Promise<Organ> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    this.entries = await Organ.loadEntries(
      this.address,
      signerOrProvider
    ).catch(error => {
      console.warn(
        "Error while reloading organ's entries",
        this.address,
        error.message
      )
      return this.entries
    })
    return this
  }

  async reloadProcedures(): Promise<Organ> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    this.procedures = await Organ.loadProcedures(
      this.address,
      signerOrProvider
    ).catch(error => {
      console.warn(
        "Error while reloading organ's procedures",
        this.address,
        error.message
      )
      return this.procedures
    })
    return this
  }

  async reloadData(): Promise<Organ> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const data = await Organ.loadData(this.address, signerOrProvider)
    this.cid = data?.cid
    return this
  }
}

export default Organ
