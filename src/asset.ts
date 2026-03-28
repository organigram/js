import AssetContract from '@organigram/protocol/abi/Asset.sol/Asset.json' with { type: 'json' }
import {
  decodeFunctionResult,
  encodeFunctionData,
  formatEther,
  zeroAddress
} from 'viem'
import { createRandom32BytesHexId, predictContractAddress } from './utils'
import { tryMulticall } from './multicall'
import {
  type ContractClients,
  getContractInstance,
  getWalletAddress
} from './contracts'

export const ERC20_INITIAL_SUPPLY = 10_000_000 // 10 million tokens.

export interface AssetJson {
  address: string
  isDeployed: boolean
  name: string
  symbol: string
  initialSupply: number
  chainId: string
  salt?: string | null
  image?: string | null
  userBalance: string
  organigramId?: string | null
}

export interface AssetInput {
  name?: string | null
  description?: string | null
  address?: string | null
  symbol?: string | null
  initialSupply?: number | null
  chainId?: string | null
  salt?: string | null
  image?: string | null
  isDeployed?: boolean
  userBalance?: string | null
  organigramId?: string | null
}

export class Asset {
  address: string
  name: string
  description: string
  symbol: string
  initialSupply: number
  chainId: string
  salt?: string | null
  image?: string | null
  isDeployed: boolean
  userBalance: string
  organigramId?: string | null

  constructor(input: AssetInput) {
    if (!input.address && !input.chainId) {
      throw new Error(
        'Either address or chainId must be provided to organ constructor.'
      )
    }
    this.name = input.name ?? 'Unnamed asset'
    this.description = input.description ?? 'This asset has no description.'
    this.isDeployed = input.isDeployed ?? false
    this.salt =
      input.salt || (this.isDeployed ? undefined : createRandom32BytesHexId())
    this.chainId = input.chainId ?? '11155111'
    this.address =
      input.address ??
      predictContractAddress({
        type: 'Asset',
        chainId: this.chainId,
        salt: this.salt!
      })
    this.symbol = input.symbol ?? 'ASSET'
    this.initialSupply = input.initialSupply ?? ERC20_INITIAL_SUPPLY
    this.image = input.image ?? undefined
    this.userBalance = input.userBalance ?? '0'
    this.organigramId = input.organigramId ?? null
  }

  static load = async (
    address: string,
    clients: ContractClients,
    initialAsset?: AssetInput
  ): Promise<(Asset & { userBalance: string }) | undefined> => {
    if (!address) {
      throw new Error('Cannot load asset: No address provided.')
    }

    const contract = getContractInstance({
      address,
      abi: AssetContract.abi,
      ...clients
    })
    const walletAddress =
      clients.walletClient != null
        ? await getWalletAddress(clients.walletClient)
        : undefined

    const multicallValues = await tryMulticall(clients, [
      {
        target: address,
        callData: encodeFunctionData({
          abi: AssetContract.abi,
          functionName: 'name'
        }),
        decode: returnData =>
          decodeFunctionResult({
            abi: AssetContract.abi,
            functionName: 'name',
            data: returnData
          })
      },
      {
        target: address,
        callData: encodeFunctionData({
          abi: AssetContract.abi,
          functionName: 'symbol'
        }),
        decode: returnData =>
          decodeFunctionResult({
            abi: AssetContract.abi,
            functionName: 'symbol',
            data: returnData
          })
      },
      {
        target: address,
        callData: encodeFunctionData({
          abi: AssetContract.abi,
          functionName: 'totalSupply'
        }),
        decode: returnData =>
          decodeFunctionResult({
            abi: AssetContract.abi,
            functionName: 'totalSupply',
            data: returnData
          })
      },
      {
        target: address,
        callData: encodeFunctionData({
          abi: AssetContract.abi,
          functionName: 'balanceOf',
          args: [walletAddress ?? zeroAddress]
        }),
        decode: returnData =>
          decodeFunctionResult({
            abi: AssetContract.abi,
            functionName: 'balanceOf',
            data: returnData
          })
      }
    ])

    const loadedValues =
      multicallValues != null
        ? await Promise.all([
            Promise.resolve(multicallValues[0] as string),
            Promise.resolve(multicallValues[1] as string),
            Promise.resolve(multicallValues[2] as bigint),
            Promise.resolve((multicallValues[3] ?? 0n) as bigint),
            initialAsset?.chainId != null
              ? Promise.resolve(initialAsset.chainId)
              : clients.publicClient.getChainId().then(String)
          ])
        : await Promise.all([
            Promise.resolve((await contract.read.name()) as string),
            Promise.resolve((await contract.read.symbol()) as string),
            Promise.resolve((await contract.read.totalSupply()) as bigint),
            walletAddress != null
              ? Promise.resolve(
                  (await contract.read.balanceOf([walletAddress])) as bigint
                )
              : Promise.resolve(0n),
            initialAsset?.chainId != null
              ? Promise.resolve(initialAsset.chainId)
              : clients.publicClient.getChainId().then(String)
          ])
    const [name, symbol, initialSupplyRaw, userBalanceRaw, chainId] =
      loadedValues

    const initialSupply = parseInt((+formatEther(initialSupplyRaw)).toFixed(0))
    let userBalance = formatEther(userBalanceRaw)
    userBalance = (+userBalance).toFixed(0)

    return new Asset({
      ...initialAsset,
      address,
      name,
      symbol,
      initialSupply,
      userBalance,
      chainId,
      isDeployed: true
    })
  }

  toJson(): AssetJson {
    return {
      address: this.address,
      name: this.name,
      symbol: this.symbol,
      initialSupply: this.initialSupply,
      chainId: this.chainId,
      salt: this.salt,
      image: this.image,
      isDeployed: this.isDeployed,
      userBalance: this.userBalance,
      organigramId: this.organigramId
    }
  }
}
