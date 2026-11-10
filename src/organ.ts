import OrganContractABI from '@organigram/protocol/abi/Organ.sol/Organ.json' with { type: 'json' }
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
  predictContractAddress
} from './utils'
import { getDefaultChainId, getDeployment } from './deployments'
import type { TransactionOptions } from './organigramClient'
import { tryMulticall } from './multicall'
import {
  type ContractClients,
  type OrganigramTransactionReceipt,
  createContractWriteTransaction,
  getContractInstance,
  getWalletAddress,
  type OrganigramContract
} from './contracts'

/** One entry of an organ registry: a member, a document, or both. */
export interface OrganEntry {
  /** Position in the registry, starting at 1. */
  index: string
  /** Ethereum address of the member, or the zero address. */
  address: string
  /** Reference to a document, or an empty string. */
  cid: string
  /** Display name. */
  name?: string | null
}

/** An entry to add to an organ: an address, a document reference, or both. */
export interface OrganEntryInput {
  /** Ethereum address of the member. */
  address?: string
  /** Reference to a document. */
  cid?: string
}

/** The permissions one address holds on an organ. */
export interface OrganPermission {
  /** Address granted the permissions, usually a procedure. */
  permissionAddress: string
  /** Bit field of `PERMISSIONS` flags. */
  permissionValue: number
}

type OrganContractData = {
  cid: string
  permissionsLength: bigint
  entriesLength: bigint
  entriesCount: bigint
}

/** The data of an organ, deployed or still a draft. */
export interface OrganInput {
  /** Contract address, or a predicted address while it is a draft. */
  address?: string | null
  /** Chain the organ lives on. */
  chainId?: string | null
  /** Client used for reads. */
  publicClient?: PublicClient | null
  /** Client that signs transactions. */
  walletClient?: WalletClient | null
  /** Ether balance, in wei. */
  balance?: string | null
  /** Reference to the off-chain metadata of the organ. */
  cid?: string | null
  /** Addresses allowed to act on the organ, with their permission flags. */
  permissions?: OrganPermission[] | null
  /** Members and documents registered in the organ. */
  entries?: Array<{
    index: string
    address: string
    cid: string
    name?: string | null
  }> | null
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Whether the contract exists on chain. */
  isDeployed?: boolean | null
  /** Display name. */
  name?: string | null
  /** Free description. */
  description?: string | null
  /** Organigram the organ belongs to. */
  organigramId?: string | null
  /** Trusted forwarder relaying gasless transactions. */
  forwarder?: string | null
}

/** An organ as plain JSON, to store or send it. */
export interface OrganJson {
  /** Contract address, or a predicted address while it is a draft. */
  address: string
  /** Display name. */
  name: string
  /** Whether the contract exists on chain. */
  isDeployed: boolean
  /** Free description. */
  description: string
  /** Reference to the off-chain metadata of the organ. */
  cid: string
  /** Members and documents registered in the organ. */
  entries: OrganEntry[]
  /** Addresses allowed to act on the organ, with their permission flags. */
  permissions: OrganPermission[]
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Chain the organ lives on. */
  chainId: string
  /** Organigram the organ belongs to. */
  organigramId: string
  /** Ether balance, in wei. */
  balance: string
}

/** The organ functions a proposal operation can call. */
export enum OrganFunctionName {
  /** Add entries. */
  addEntries = 'addEntries',
  /** Remove entries. */
  removeEntries = 'removeEntries',
  /** Replace one entry. */
  replaceEntry = 'replaceEntry',
  /** Grant permissions to an address. */
  addPermission = 'addPermission',
  /** Revoke the permissions of an address. */
  removePermission = 'removePermission',
  /** Move permissions to another address. */
  replacePermission = 'replacePermission',
  /** Send ether. */
  withdrawEther = 'withdrawEther',
  /** Send ERC-20 tokens. */
  withdrawERC20 = 'withdrawERC20',
  /** Send an ERC-721 token. */
  withdrawERC721 = 'withdrawERC721'
}

const formatPermissionValue = (value: number | string | bigint) =>
  padHex(
    (typeof value === 'string' && value.startsWith('0x')
      ? value
      : toHex(value)) as Hex,
    { size: 2 }
  )

const normalizeEntry = (entry: OrganEntryInput) => ({
  addr: entry.address ?? zeroAddress,
  cid: entry.cid ?? ''
})

const isNonEmptyEntry = (entry: OrganEntryInput) =>
  (entry.address != null && entry.address !== '') ||
  (entry.cid != null && entry.cid !== '')

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

const isActiveLoadedEntry = (
  entry: OrganEntry | null | undefined
): entry is OrganEntry => {
  if (entry == null) return false
  return (entry.address ?? zeroAddress) !== zeroAddress || (entry.cid ?? '') !== ''
}

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
        args: [(args[0] as OrganEntryInput[]).map(normalizeEntry)]
      }
    case OrganFunctionName.removeEntries:
      return {
        functionName: 'removeEntries',
        args: [(args[0] as string[]).map(index => BigInt(index))]
      }
    case OrganFunctionName.replaceEntry: {
      const [index, entry] = args as [number | string | bigint, OrganEntryInput]
      if (!isNonEmptyEntry(entry)) {
        throw new Error('Entry must include an address or a CID.')
      }
      return {
        functionName: 'replaceEntry',
        args: [BigInt(index), normalizeEntry(entry)]
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
        functionName: 'transferEther',
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

/**
 * A group of the organization: a registry of members and documents, a list of permissions, and a balance of assets.
 *
 * @remarks Every change to an organ must come from an address holding the matching permission. In a governed organization, that address is a procedure, so that each change goes through a decision.
 */
export class Organ {
  /** ERC-165 interface identifier of organ contracts. */
  static INTERFACE = '0xf81b1307'

  /** Display name. */
  name: string
  /** Free description. */
  description: string
  /** Contract address, or a predicted address while it is a draft. */
  address: string
  /** Salt that determines the clone address. */
  salt: string | undefined
  /** Chain the organ lives on. */
  chainId: string
  /** Ether balance, in wei. */
  balance: string
  /** Addresses allowed to act on the organ, with their permission flags. */
  permissions: OrganPermission[] = []
  /** Reference to the off-chain metadata of the organ. */
  cid: string
  /** Members and documents registered in the organ. */
  entries: OrganEntry[] = []
  /** Client that signs transactions. */
  walletClient?: WalletClient
  /** Client used for reads. */
  publicClient?: PublicClient
  /** viem contract instance, once loaded. */
  contract?: OrganigramContract
  /** Whether the contract exists on chain. */
  isDeployed: boolean
  /** Organigram the organ belongs to. */
  organigramId: string
  /** Trusted forwarder relaying gasless transactions. */
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
    this.chainId = chainId ?? getDefaultChainId()
    this.address =
      address ??
      predictContractAddress({
        type: 'Organ',
        chainId: this.chainId,
        salt: this.salt!
      })
    this.organigramId = organigramId ?? 'default-organigram-id'
    this.forwarder = forwarder ?? getDeployment(this.chainId, 'MetaGasStation')
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

  /** Replace the reference to the off-chain metadata of the organ. */
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

  /** Add members or documents to the registry. */
  public addEntries = async (
    entries: OrganEntryInput[],
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const normalizedEntries = entries
      .map(entry => {
        if (!isNonEmptyEntry(entry)) {
          return undefined
        }
        return normalizeEntry(entry)
      })
      .filter(entry => entry != null)
    if (normalizedEntries.length === 0) {
      throw new Error('At least one entry with an address or a CID is required.')
    }
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

  /** Remove entries from the registry, by index. */
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

  /** Replace one entry of the registry. */
  public replaceEntry = async (
    index: number,
    entry: OrganEntryInput,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    if (!isNonEmptyEntry(entry)) {
      throw new Error('Entry must include an address or a CID.')
    }
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'replaceEntry',
      args: [BigInt(index), normalizeEntry(entry)],
      clients: this.getClients(),
      nonce: options?.nonce
    })
    options?.onTransaction?.(tx, `Replace entry ${index} of organ ${this.address}.`)
    return await tx.wait()
  }

  /** Grant permissions to an address. */
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

  /** Revoke every permission of an address. */
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

  /** Move permissions from one address to another. */
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

  /** Send ether held by the organ. */
  public withdrawEther = async (
    to: string,
    value: string | number | bigint,
    options?: TransactionOptions
  ): Promise<OrganigramTransactionReceipt> => {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: OrganContractABI.abi,
      functionName: 'transferEther',
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

  /** Send ERC-20 tokens held by the organ. */
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

  /** Send an ERC-721 token held by the organ. */
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

  /** Read an organ from chain: its entries, permissions and metadata. */
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

  /** Tell whether a contract is an organ. */
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

  /** Read the ether balance of an organ, in wei. */
  static async getBalance(
    address: string,
    clients: ContractClients
  ): Promise<bigint> {
    return await clients.publicClient.getBalance({
      address: address as `0x${string}`
    })
  }

  /** Read the metadata reference and registry sizes of an organ. */
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

  /** Find the entry of an address in an organ, if it is a member. */
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

  /** Read the permission flags an address holds on an organ. */
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

  /** Read one permission of an organ, by index. */
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

  /** Read every permission of an organ. */
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

  /** Read one entry of an organ, by index. */
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

  /** Read every entry of an organ. */
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
      return multicallEntries.filter(isActiveLoadedEntry)
    }

    const entries = await Promise.all(
      indexes.map(async index => {
        // A load-balanced RPC node may be a block behind the one that returned
        // entriesLength: retry for about a block before reporting it missing.
        let entry: OrganEntry | null = null
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            entry = await Organ.loadEntry(address, index.toString(), clients)
            break
          } catch (error) {
            if (attempt === 3) {
              console.warn(
                'Error while loading entry in organ.',
                address,
                index.toString(),
                (error as Error).message
              )
            } else {
              await new Promise(resolve => setTimeout(resolve, 4_000))
            }
          }
        }
        if (isActiveLoadedEntry(entry)) {
          return entry
        }
        return null
      })
    )

    return entries.filter((entry): entry is OrganEntry => entry != null)
  }

  /**
   * Encode a call to an organ function, to use it as a proposal operation with `Procedure.createOperation()`.
   *
   * @example
   * ```ts
   * const call = await Organ.populateTransaction(organAddress, walletClient, 'addEntries', [
   *   { address: memberAddress }
   * ])
   * const operation = Procedure.createOperation(call)
   * ```
   */
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

  /** Read the whole organ again from chain. */
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

  /** Read the entries again from chain. */
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

  /** Read the permissions again from chain. */
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

  /** Read the metadata reference again from chain. */
  async reloadData(): Promise<Organ> {
    const data = await Organ.loadData(this.address, this.getClients())
    this.cid = data?.cid
    return this
  }

  /** Convert the organ into plain JSON. */
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
