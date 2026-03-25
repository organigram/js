import OrganContractABI from '@organigram/protocol/artifacts/contracts/Organ.sol/Organ.json'
import {
  decodeFunctionResult,
  encodeFunctionData,
  padHex,
  toHex,
  type Hex,
  type PublicClient,
  type WalletClient,
  zeroAddress
} from 'viem'

import {
  createRandom32BytesHexId,
  deployedAddresses,
  predictContractAddress
} from './utils'
import type { TransactionOptions } from './organigramClient'
import { tryMulticall } from './multicall'
import {
  type ContractClients,
  type OrganigramTransactionReceipt,
  createContractWriteTransaction,
  getContractInstance,
  getWalletAddress
} from './contracts'

export interface OrganEntry {
  index: string
  address: string
  cid: string
}

export interface IOrganEntry {
  address?: string
  cid?: string
}

export interface OrganPermission {
  permissionAddress: string
  permissionValue: number
}

type OrganContractData = {
  cid: string
  permissionsLength: bigint
  entriesLength: bigint
  entriesCount: bigint
}

export interface OrganInput {
  address?: string | null
  chainId?: string | null
  publicClient?: PublicClient | null
  walletClient?: WalletClient | null
  balance?: string | null
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
  balance: string
}

export enum OrganFunctionName {
  addEntries = 'addEntries',
  removeEntries = 'removeEntries',
  replaceEntry = 'replaceEntry',
  addPermission = 'addPermission',
  removePermission = 'removePermission',
  replacePermission = 'replacePermission',
  withdrawEther = 'withdrawEther',
  withdrawERC20 = 'withdrawERC20',
  withdrawERC721 = 'withdrawERC721'
}

const formatPermissionValue = (value: number | string | bigint) =>
  padHex(
    (typeof value === 'string' && value.startsWith('0x')
      ? value
      : toHex(value)) as Hex,
    { size: 2 }
  )

const normalizeEntry = (entry: IOrganEntry) => ({
  addr: entry.address ?? zeroAddress,
  cid: entry.cid ?? ''
})

const normalizeLoadedOrganData = (data: any): OrganContractData => ({
  cid: data.cid ?? data[0],
  permissionsLength: BigInt(data.permissionsLength ?? data[1] ?? 0),
  entriesLength: BigInt(data.entriesLength ?? data[2] ?? 0),
  entriesCount: BigInt(data.entriesCount ?? data[3] ?? 0)
})

const normalizeLoadedPermission = (permission: any): OrganPermission => ({
  permissionAddress: permission.addr ?? permission.address ?? permission[0],
  permissionValue:
    typeof (permission.perms ?? permission[1]) === 'string'
      ? parseInt(permission.perms ?? permission[1], 16)
      : Number(permission.perms ?? permission[1])
})

const normalizeLoadedEntry = (entry: any, index: string): OrganEntry => ({
  index,
  address: entry.addr ?? entry.address ?? entry[0],
  cid: entry.cid ?? entry[1]
})

const normalizeOrganFunctionCall = async ({
  functionName,
  args,
  walletClient
}: {
  functionName: OrganFunctionName | string
  args: unknown[]
  walletClient?: WalletClient | null
}): Promise<{ functionName: string; args: unknown[] }> => {
  switch (functionName) {
    case OrganFunctionName.addEntries:
      return {
        functionName: 'addEntries',
        args: [(args[0] as IOrganEntry[]).map(normalizeEntry)]
      }
    case OrganFunctionName.removeEntries:
      return {
        functionName: 'removeEntries',
        args: [(args[0] as string[]).map(index => BigInt(index))]
      }
    case OrganFunctionName.replaceEntry: {
      const [index, entry] = args as [number | string | bigint, OrganEntry]
      return {
        functionName: 'replaceEntry',
        args: [BigInt(index), entry.address ?? '', entry.cid ?? '']
      }
    }
    case OrganFunctionName.addPermission: {
      const [permissionAddress, permissionValue] = args as [string, number]
      return {
        functionName: 'addPermission',
        args: [permissionAddress, formatPermissionValue(permissionValue)]
      }
    }
    case OrganFunctionName.removePermission:
      return {
        functionName: 'removePermission',
        args
      }
    case OrganFunctionName.replacePermission: {
      const [oldPermissionAddress, newPermissionAddress, permissionValue] =
        args as [string, string, number]
      return {
        functionName: 'replacePermission',
        args: [
          oldPermissionAddress,
          newPermissionAddress,
          formatPermissionValue(permissionValue)
        ]
      }
    }
    case OrganFunctionName.withdrawEther: {
      const [to, value] = args as [string, string | number | bigint]
      return {
        functionName: 'transfer',
        args: [to, BigInt(value)]
      }
    }
    case OrganFunctionName.withdrawERC20: {
      const [token, maybeFromOrTo, maybeToOrAmount, maybeAmount] = args
      const from =
        maybeAmount == null
          ? walletClient != null
            ? await getWalletAddress(walletClient)
            : undefined
          : (maybeFromOrTo as string)
      const to =
        maybeAmount == null
          ? (maybeFromOrTo as string)
          : (maybeToOrAmount as string)
      const amount = maybeAmount ?? maybeToOrAmount
      if (from == null) {
        throw new Error('Wallet client not connected.')
      }
      return {
        functionName: 'transferCoins',
        args: [token, from, to, BigInt(amount as string | number | bigint)]
      }
    }
    case OrganFunctionName.withdrawERC721: {
      const [token, maybeFromOrTo, maybeToOrTokenId, maybeTokenId] = args
      const from =
        maybeTokenId == null
          ? walletClient != null
            ? await getWalletAddress(walletClient)
            : undefined
          : (maybeFromOrTo as string)
      const to =
        maybeTokenId == null
          ? (maybeFromOrTo as string)
          : (maybeToOrTokenId as string)
      const tokenId = maybeTokenId ?? maybeToOrTokenId
      if (from == null) {
        throw new Error('Wallet client not connected.')
      }
      return {
        functionName: 'transferCollectible',
        args: [token, from, to, BigInt(tokenId as string | number | bigint)]
      }
    }
    default:
      return { functionName: String(functionName), args }
  }
}

export class Organ {
  static INTERFACE = '0xf81b1307'

  name: string
  description: string
  address: string
  salt: string | undefined
  chainId: string
  balance: string
  permissions: OrganPermission[] = []
  cid: string
  entries: OrganEntry[] = []
  walletClient?: WalletClient
  publicClient?: PublicClient
  contract?: any
  isDeployed: boolean
  organigramId: string
  forwarder: string

  public constructor({
    address,
    chainId,
    publicClient,
    walletClient,
    balance,
    permissions,
    cid,
    entries,
    salt,
    isDeployed,
    name,
    description,
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
    this.balance = balance ?? '0'
    this.permissions = permissions ?? []
    this.cid = cid ?? ''
    this.entries = entries ?? []
    this.publicClient = publicClient ?? undefined
    this.walletClient = walletClient ?? undefined
    this.contract =
      this.publicClient != null
        ? getContractInstance({
            address: this.address,
            abi: OrganContractABI.abi,
            publicClient: this.publicClient,
            walletClient: this.walletClient
          })
        : undefined
  }

  private getClients(): ContractClients {
    if (this.publicClient == null) {
      throw new Error('Public client not connected.')
    }
    return {
      publicClient: this.publicClient,
      walletClient: this.walletClient
    }
  }

  private getContract() {
    if (this.contract == null) {
      const clients = this.getClients()
      this.contract = getContractInstance({
        address: this.address,
        abi: OrganContractABI.abi,
        ...clients
      })
    }
    return this.contract
  }

  public updateCid = async (
    cid: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'updateCid',
      args: [cid],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(tx, `Update CID of organ ${this.address} to ${cid}.`)
    return await tx.wait()
  }

  public addEntries = async (
    entries: IOrganEntry[],
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const normalizedEntries = entries
      .map(entry => {
        if (
          (entry.address == null || entry.address === '') &&
          (entry.cid == null || entry.cid === '')
        ) {
          return undefined
        }
        return normalizeEntry(entry)
      })
      .filter(entry => entry != null)
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'addEntries',
      args: [normalizedEntries],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Add ${normalizedEntries.length} entries to organ ${this.address}.`
    )
    return await tx.wait()
  }

  public removeEntries = async (
    indexes: string[],
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'removeEntries',
      args: [indexes.map(index => BigInt(index))],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Remove ${indexes.length} entries from organ ${this.address}.`
    )
    return await tx.wait()
  }

  public replaceEntry = async (
    index: number,
    entry: OrganEntry,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'replaceEntry',
      args: [BigInt(index), entry.address ?? '', entry.cid ?? ''],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(tx, `Replace entry ${index} of organ ${this.address}.`)
    return await tx.wait()
  }

  public addPermission = async (
    permission: OrganPermission,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'addPermission',
      args: [
        permission.permissionAddress,
        formatPermissionValue(permission.permissionValue)
      ],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Add permission ${permission.permissionAddress} to organ ${this.address}.`
    )
    return await tx.wait()
  }

  public removePermission = async (
    permission: string,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'removePermission',
      args: [permission],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Remove permission ${permission} from organ ${this.address}.`
    )
    return await tx.wait()
  }

  public replacePermission = async (
    oldPermissionAddress: string,
    newOrganPermission: OrganPermission,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'replacePermission',
      args: [
        oldPermissionAddress,
        newOrganPermission.permissionAddress,
        formatPermissionValue(newOrganPermission.permissionValue)
      ],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Replace procedure ${oldPermissionAddress} with ${newOrganPermission.permissionAddress} in organ ${this.address}.`
    )
    return await tx.wait()
  }

  public withdrawEther = async (
    to: string,
    value: string | number | bigint,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'transfer',
      args: [to, BigInt(value)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Withdraw ${value.toString()} wei from organ ${this.address} to ${to}.`
    )
    return await tx.wait()
  }

  public withdrawERC20 = async (
    token: string,
    to: string,
    amount: string | number | bigint,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    if (this.walletClient == null) {
      throw new Error('Wallet client not connected.')
    }
    const from = await getWalletAddress(this.walletClient)
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'transferCoins',
      args: [token, from, to, BigInt(amount)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Withdraw ${amount.toString()} ERC20 units from organ ${this.address} to ${to}.`
    )
    return await tx.wait()
  }

  public withdrawERC721 = async (
    token: string,
    to: string,
    tokenId: string | number | bigint,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    if (this.walletClient == null) {
      throw new Error('Wallet client not connected.')
    }
    const from = await getWalletAddress(this.walletClient)
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'transferCollectible',
      args: [token, from, to, BigInt(tokenId)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(
      tx,
      `Withdraw ERC721 token ${tokenId.toString()} from organ ${this.address} to ${to}.`
    )
    return await tx.wait()
  }

  static async load(
    address: string,
    clients: ContractClients,
    initialOrgan?: OrganInput
  ): Promise<Organ> {
    if (!address) {
      throw new Error('Cannot load organ: No address provided.')
    }
    const chainId =
      initialOrgan?.chainId ?? String(await clients.publicClient.getChainId())
    const data = await Organ.loadData(address, clients)
    const balance = await clients.publicClient
      .getBalance({ address: address as `0x${string}` })
      .then((value: bigint) => value.toString())
      .catch(() => '0')
    const [permissions, entries] = await Promise.all([
      Organ.loadPermissions(address, clients, data),
      Organ.loadEntries(address, clients, data).catch((error: Error) => {
        console.warn(error.message)
        return []
      })
    ])

    return new Organ({
      ...initialOrgan,
      address,
      chainId,
      publicClient: clients.publicClient,
      walletClient: clients.walletClient,
      balance,
      permissions,
      cid: data?.cid,
      entries,
      isDeployed: true
    })
  }

  static async isOrgan(
    address: string,
    clients: ContractClients
  ): Promise<boolean> {
    const contract = getContractInstance({
      address,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    const isERC165 = await contract.read.supportsInterface(['0x01ffc9a7'])
    if (isERC165 === false) return false
    return Boolean(await contract.read.supportsInterface([Organ.INTERFACE]))
  }

  static async getBalance(
    address: string,
    clients: ContractClients
  ): Promise<bigint> {
    return await clients.publicClient.getBalance({
      address: address as `0x${string}`
    })
  }

  static async loadData(
    address: string,
    clients: ContractClients
  ): Promise<OrganContractData> {
    const contract = getContractInstance({
      address,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    return await contract.read
      .getOrgan()
      .then(data => normalizeLoadedOrganData(data as any))
      .catch((error: Error) => {
        console.error(error.message)
        throw error
      })
  }

  static async loadEntryForAccount(
    address: string,
    account: string,
    clients: ContractClients
  ): Promise<OrganEntry | undefined> {
    const contract = getContractInstance({
      address,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    const index = (await contract.read.getEntryIndexForAddress([account])) as
      | bigint
      | string
    return await Organ.loadEntry(address, index.toString(), clients).catch(
      () => undefined
    )
  }

  static async checkAddressPermissions(
    organAddress: string,
    addressToCheck: string,
    clients: ContractClients
  ): Promise<number> {
    const contract = getContractInstance({
      address: organAddress,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    const result = await contract.read.getPermissions([addressToCheck]).catch(
      (error: Error) => {
        console.error('Error', error.message)
        return '0x0000'
      }
    )
    return typeof result === 'string' ? parseInt(result, 16) : Number(result)
  }

  static async loadPermission(
    address: string,
    index: string,
    clients: ContractClients
  ): Promise<OrganPermission> {
    const contract = getContractInstance({
      address,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    const permission = await contract.read
      .getPermission([BigInt(index)])
      .catch((error: Error) => {
        console.error(error.message)
      })
    if (permission == null) {
      throw new Error('Unable to load permission.')
    }
    return normalizeLoadedPermission(permission as any)
  }

  static async loadPermissions(
    address: string,
    clients: ContractClients,
    data?: OrganContractData
  ): Promise<OrganPermission[]> {
    const organData = data ?? (await Organ.loadData(address, clients))
    const multicallPermissions = await tryMulticall(
      clients,
      Array.from({ length: Number(organData.permissionsLength) }).map(
        (_, index) => ({
          target: address,
          callData: encodeFunctionData({
            abi: OrganContractABI.abi,
            functionName: 'getPermission',
            args: [BigInt(index)]
          }),
          decode: returnData => {
            const permission = decodeFunctionResult({
              abi: OrganContractABI.abi,
              functionName: 'getPermission',
              data: returnData
            }) as any
            return normalizeLoadedPermission(permission)
          }
        })
      )
    )

    if (multicallPermissions != null) {
      return multicallPermissions.filter(
        (permission): permission is OrganPermission => permission != null
      )
    }

    return (
      await Promise.all(
        Array.from({ length: Number(organData.permissionsLength) }).map(
          async (_, index) =>
            await Organ.loadPermission(address, index.toString(), clients).catch(
              (error: Error) => {
                console.warn(
                  'Error while loading permission in organ.',
                  address,
                  index.toString(),
                  error.message
                )
                return null
              }
            )
        )
      )
    ).filter((permission): permission is OrganPermission => permission != null)
  }

  static async loadEntry(
    address: string,
    index: string,
    clients: ContractClients
  ): Promise<OrganEntry> {
    const contract = getContractInstance({
      address,
      abi: OrganContractABI.abi,
      publicClient: clients.publicClient
    })
    const entry = (await contract.read.getEntry([BigInt(index)])) as any
    return normalizeLoadedEntry(entry, index)
  }

  static async loadEntries(
    address: string,
    clients: ContractClients,
    data?: OrganContractData
  ): Promise<OrganEntry[]> {
    const organData = data ?? (await Organ.loadData(address, clients))
    const indexes = Array.from(
      { length: Math.max(Number(organData.entriesLength) - 1, 0) },
      (_, index) => index + 1
    )
    const multicallEntries = await tryMulticall(
      clients,
      indexes.map(index => ({
        target: address,
        callData: encodeFunctionData({
          abi: OrganContractABI.abi,
          functionName: 'getEntry',
          args: [BigInt(index)]
        }),
        decode: returnData => {
          const entry = decodeFunctionResult({
            abi: OrganContractABI.abi,
            functionName: 'getEntry',
            data: returnData
          }) as any
          return normalizeLoadedEntry(entry, index.toString())
        }
      }))
    )

    if (multicallEntries != null) {
      return multicallEntries.filter(
        (entry): entry is OrganEntry =>
          entry != null && entry.address !== zeroAddress
      )
    }

    const entries = await Promise.all(
      indexes.map(async index => {
        const entry = await Organ.loadEntry(
          address,
          index.toString(),
          clients
        ).catch((error: Error) => {
          console.warn(
            'Error while loading entry in organ.',
            address,
            index.toString(),
            error.message
          )
          return null
        })
        if (entry != null && entry.address !== zeroAddress) {
          return entry
        }
        return null
      })
    )

    return entries.filter((entry): entry is OrganEntry => entry != null)
  }

  static async populateTransaction(
    address: string,
    walletClient: WalletClient,
    functionName: OrganFunctionName | string,
    ...args: unknown[]
  ): Promise<{ to: string; data: string; functionName: string }> {
    const normalizedCall = await normalizeOrganFunctionCall({
      functionName,
      args,
      walletClient
    })
    return {
      to: address,
      functionName: normalizedCall.functionName,
      data: encodeFunctionData({
        abi: OrganContractABI.abi,
        functionName: normalizedCall.functionName,
        args: normalizedCall.args as never
      })
    }
  }

  async reload(): Promise<Organ> {
    const { permissions, cid, entries } = await Organ.load(
      this.address,
      this.getClients()
    )
    this.cid = cid
    this.permissions = permissions
    this.entries = entries
    return this
  }

  async reloadEntries(): Promise<Organ> {
    this.entries = await Organ.loadEntries(this.address, this.getClients()).catch(
      (error: Error) => {
        console.warn(
          "Error while reloading organ's entries",
          this.address,
          error.message
        )
        return this.entries
      }
    )
    return this
  }

  async reloadPermissions(): Promise<Organ> {
    this.permissions = await Organ.loadPermissions(
      this.address,
      this.getClients()
    ).catch((error: Error) => {
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
    const data = await Organ.loadData(this.address, this.getClients())
    this.cid = data?.cid
    return this
  }

  toJson = (): OrganJson =>
    JSON.parse(
      JSON.stringify({
        address: this.address,
        name: this.name,
        description: this.description,
        cid: this.cid,
        entries: this.entries,
        permissions: this.permissions,
        salt: this.salt,
        chainId: this.chainId ?? '',
        organigramId: this.organigramId ?? '',
        isDeployed: this.isDeployed,
        balance: this.balance.toString() + 'n'
      })
    )
}
