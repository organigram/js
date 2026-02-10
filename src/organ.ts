import { ethers, type Signer } from 'ethers'
import OrganContractABI from '@organigram/protocol/artifacts/contracts/Organ.sol/Organ.json'

import {
  createRandom32BytesHexId,
  deployedAddresses,
  predictContractAddress
} from './utils'
import type { TransactionOptions } from './organigramClient'
import { SourceOrgan, TargetOrgan } from './organigram'

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
export interface OrganPermission {
  permissionAddress: string
  permissionValue: number
}

export interface OrganInput {
  address?: string | null
  chainId?: string | null
  signerOrProvider?: ethers.Signer | ethers.Provider | null
  balance?: bigint | null
  cid?: string | null
  permissions?: OrganPermission[] | null
  entries?: Array<{
    index: string
    address: string
    cid: string
  }> | null
  salt?: string | null
  isDeployed?: boolean | null
  name?: string | null
  description?: string | null
  isSource?: SourceOrgan[] | null
  isTarget?: TargetOrgan[] | null
  organigramId?: string | null
  forwarder?: string | null
}

export interface OrganJson {
  address: string
  name: string
  isDeployed: boolean
  description: string
  cid: string
  entries: OrganEntry[]
  permissions: OrganPermission[]
  salt?: string | null
  chainId: string
  organigramId: string
  isSource: SourceOrgan[]
  isTarget: TargetOrgan[]
  balance: bigint
}

export enum OrganFunctionName {
  addEntries,
  removeEntries,
  replaceEntry,
  addPermission,
  removePermission,
  replacePermission,
  withdrawEther,
  withdrawERC20,
  withdrawERC721
}

export class Organ {
  static INTERFACE = '0xf81b1307' // Organ.INTERFACE_ID.
  name: string
  description: string
  address: string
  salt: string | undefined
  chainId: string
  balance: bigint
  permissions: OrganPermission[] = []
  cid: string
  entries: OrganEntry[] = []
  signer: Signer | undefined
  provider: ethers.Provider | undefined
  contract: ethers.Contract
  isDeployed: boolean
  organigramId: string
  forwarder: string

  // State variables that are helpful in the context of an organigram
  isSource: SourceOrgan[]
  isTarget: TargetOrgan[]

  public constructor({
    address,
    chainId,
    signerOrProvider,
    balance,
    permissions,
    cid,
    entries,
    salt,
    isDeployed,
    name,
    description,
    isSource,
    isTarget,
    organigramId,
    forwarder
  }: OrganInput) {
    this.name = name ?? 'Unnamed Organ'
    this.description = description ?? 'This organ does not have a description.'
    this.isDeployed = isDeployed ?? false
    this.salt =
      salt || (this.isDeployed ? undefined : createRandom32BytesHexId())
    this.chainId = chainId ?? '11155111'
    this.address =
      address ??
      predictContractAddress({
        type: 'Organ',
        chainId: this.chainId,
        salt: this.salt!
      })
    this.organigramId = organigramId ?? 'default-organigram-id'
    this.forwarder =
      forwarder ?? deployedAddresses[this.chainId as '11155111']?.MetaGasStation
    this.balance = balance ?? 0n
    this.permissions = permissions ?? []
    this.cid = cid ?? ''
    this.entries = entries ?? []
    if (signerOrProvider?.provider != null) {
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
      this.address,
      OrganContractABI.abi,
      signerOrProvider
    )
    this.isSource = isSource ?? []
    this.isTarget = isTarget ?? []
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
          addr: e.address ?? ethers.ZeroAddress,
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

  public addPermission = async (
    permission: OrganPermission,
    options?: TransactionOptions
  ): Promise<ethers.ContractTransactionReceipt> => {
    const permissions = `0x${permission.permissionValue
      .toString(16)
      .padStart(4, '0')}`
    const tx = await this.contract.addPermission(
      permission.permissionAddress,
      permissions,
      { ...(options?.nonce != null ? { nonce: options.nonce } : {}) }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Add permission ${permission.permissionAddress} to organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public removePermission = async (
    permission: string,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const tx = await this.contract.removePermission(permission, {
      ...(options?.nonce != null ? { nonce: options.nonce } : {})
    })
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Remove permission ${permission} from organ ${this.address}.`
      )
    }
    return await tx.wait()
  }

  public replacePermission = async (
    oldPermissionAddress: string,
    newOrganPermission: OrganPermission,
    options?: TransactionOptions
  ): Promise<ethers.Transaction> => {
    const permissions = `0x${newOrganPermission.permissionValue
      .toString(16)
      .padStart(4, '0')}`
    const tx = await this.contract.replacePermission(
      oldPermissionAddress,
      newOrganPermission.permissionAddress,
      permissions,
      { ...(options?.nonce != null ? { nonce: options.nonce } : {}) }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Replace procedure ${oldPermissionAddress} with ${newOrganPermission.permissionAddress} in organ ${this.address}.`
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
    const permissions: OrganPermission[] = await Organ.loadPermissions(
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
      permissions,
      cid: data?.cid,
      entries,
      isDeployed: true
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
    permissionsLength: bigint
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

  static async checkAddressPermissions(
    organAddress: string,
    addressToCheck: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<number> {
    const contract = new ethers.Contract(
      organAddress,
      OrganContractABI.abi,
      signerOrProvider
    )
    return await contract
      .getPermissions(addressToCheck)
      .catch((e: Error) => {
        console.error('Error', e.message)
      })
      .then((res: { perms: string | number }) =>
        typeof res.perms === 'string' ? parseInt(res.perms, 16) : res.perms
      )
  }

  static async loadPermission(
    address: string,
    index: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganPermission> {
    const contract = new ethers.Contract(
      address,
      OrganContractABI.abi,
      signerOrProvider
    )
    const permission = await contract.getPermission(index).catch((e: Error) => {
      console.error(e.message)
    })
    if (permission == null) {
      throw new Error('Unable to load permission.')
    }
    return {
      permissionAddress: permission.addr,
      permissionValue:
        typeof permission.perms === 'string'
          ? parseInt(permission.perms, 16)
          : permission.perms
    }
  }

  static async loadPermissions(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<OrganPermission[]> {
    const data = await Organ.loadData(address, signerOrProvider)
    const permissions: OrganPermission[] = []
    for (let i = 0n; i < data.permissionsLength; i++) {
      const permission: OrganPermission | null = await Organ.loadPermission(
        address,
        i.toString(),
        signerOrProvider
      ).catch((error: Error) => {
        console.warn(
          'Error while loading permission in organ ',
          address,
          i.toString(),
          error.message
        )
        return null
      })
      if (permission != null) permissions.push(permission)
    }
    return permissions
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
          if (entry != null && entry.address !== ethers.ZeroAddress) {
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
    const { permissions, cid, entries } = await Organ.load(
      this.address,
      signerOrProvider
    )
    this.cid = cid
    this.permissions = permissions
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

  async reloadPermissions(): Promise<Organ> {
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    this.permissions = await Organ.loadPermissions(
      this.address,
      signerOrProvider
    ).catch(error => {
      console.warn(
        "Error while reloading organ's permissions",
        this.address,
        error.message
      )
      return this.permissions
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

  toJson(): OrganJson {
    return {
      address: this.address,
      name: this.name,
      description: this.description,
      cid: this.cid,
      entries: this.entries,
      permissions: this.permissions,
      salt: this.salt,
      chainId: this.chainId ?? '',
      organigramId: this.organigramId ?? '',
      isSource: this.isSource,
      isTarget: this.isTarget,
      isDeployed: this.isDeployed,
      balance: this.balance
    }
  }
}

export default Organ
