import AssetContract from '@organigram/protocol/abi/Asset.sol/Asset.json' with { type: 'json' }
import {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  zeroAddress
} from 'viem'
import { createRandom32BytesHexId, predictContractAddress } from './utils'
import { getDefaultChainId } from './deployments'
import { tryMulticall } from './multicall'
import {
  type ContractClients,
  getContractInstance,
  getWalletAddress
} from './contracts'

/** Default supply minted for a new asset, in whole tokens. */
export const ERC20_INITIAL_SUPPLY = 10_000_000 // 10 million tokens.

/** An asset as plain JSON, to store or send it. */
export interface AssetJson {
  /** Contract address, or a predicted address while it is a draft. */
  address: string
  /** Whether the contract exists on chain. */
  isDeployed: boolean
  /** Token name. */
  name: string
  /** Token symbol. */
  symbol: string
  /** Supply minted at deployment, in whole tokens. */
  initialSupply: number
  /** Chain the asset lives on. */
  chainId: string
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Logo URL. */
  image?: string | null
  /** Balance of the connected wallet, in the smallest unit. */
  userBalance: string
  /**
   * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
   */
  kind: 'asset' | 'equity'
  /** Procedure authorized to settle this equity token's transfers. */
  decisionProcedure?: string | null
  /** Organigram the asset belongs to. */
  organigramId?: string | null
}

/** The data of an asset, deployed or still a draft. */
export interface AssetInput {
  /** Token name. */
  name?: string | null
  /** Free description. */
  description?: string | null
  /** Contract address, or a predicted address while it is a draft. */
  address?: string | null
  /** Token symbol. */
  symbol?: string | null
  /** Supply minted at deployment, in whole tokens. */
  initialSupply?: number | null
  /** Chain the asset lives on. */
  chainId?: string | null
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Logo URL. */
  image?: string | null
  /** Whether the contract exists on chain. */
  isDeployed?: boolean
  /** Balance of the connected wallet, in the smallest unit. */
  userBalance?: string | null
  /** Organigram the asset belongs to. */
  organigramId?: string | null
  /**
   * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
   */
  kind?: 'asset' | 'equity' | null
  /** Procedure authorized to settle this equity token's transfers. */
  decisionProcedure?: string | null
}

/** An ERC-20 token held by organs: a plain asset or company equity. */
export class Asset {
  /** Contract address, or a predicted address while it is a draft. */
  address: string
  /** Token name. */
  name: string
  /** Free description. */
  description: string
  /** Token symbol. */
  symbol: string
  /** Supply minted at deployment, in whole tokens. */
  initialSupply: number
  /** Chain the asset lives on. */
  chainId: string
  /** Salt that determines the clone address. */
  salt?: string | null
  /** Logo URL. */
  image?: string | null
  /** Whether the contract exists on chain. */
  isDeployed: boolean
  /** Balance of the connected wallet, in the smallest unit. */
  userBalance: string
  /** Organigram the asset belongs to. */
  organigramId?: string | null
  /**
   * `asset` for a plain token, `equity` for company shares whose transfers a procedure approves.
   */
  kind: 'asset' | 'equity'
  /** Procedure that approves transfers of this equity token. */
  decisionProcedure?: string | null
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
    this.chainId = input.chainId ?? getDefaultChainId()
    this.kind = input.kind ?? 'asset'
    this.address =
      input.address ??
      predictContractAddress({
        type: this.kind === 'equity' ? 'EquityToken' : 'Asset',
        chainId: this.chainId,
        salt: this.salt!
      })
    this.symbol = input.symbol ?? 'ASSET'
    this.initialSupply = input.initialSupply ?? ERC20_INITIAL_SUPPLY
    this.image = input.image ?? undefined
    this.userBalance = input.userBalance ?? '0'
    this.organigramId = input.organigramId ?? null
    this.decisionProcedure = input.decisionProcedure ?? null
  }

  /**
   * Hydrate an asset from chain state.
   *
   * @param address - Asset contract address.
   * @param clients - viem clients used to query the contract.
   * @param initialAsset - Optional fallback metadata merged into the loaded asset.
   */
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
          functionName: 'decimals'
        }),
        decode: returnData =>
          decodeFunctionResult({
            abi: AssetContract.abi,
            functionName: 'decimals',
            data: returnData
          })
      },
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
            Promise.resolve(multicallValues[3] as number),
            Promise.resolve((multicallValues[4] ?? 0n) as bigint),
            initialAsset?.chainId != null
              ? Promise.resolve(initialAsset.chainId)
              : clients.publicClient.getChainId().then(String)
          ])
        : await Promise.all([
            Promise.resolve((await contract.read.name()) as string),
            Promise.resolve((await contract.read.symbol()) as string),
            Promise.resolve((await contract.read.totalSupply()) as bigint),
            Promise.resolve((await contract.read.decimals()) as number),
            walletAddress != null
              ? Promise.resolve(
                  (await contract.read.balanceOf([walletAddress])) as bigint
                )
              : Promise.resolve(0n),
            initialAsset?.chainId != null
              ? Promise.resolve(initialAsset.chainId)
              : clients.publicClient.getChainId().then(String)
          ])
    const [name, symbol, initialSupplyRaw, decimals, userBalanceRaw, chainId] =
      loadedValues

    const initialSupply = parseInt((+formatUnits(initialSupplyRaw, decimals)).toFixed(0))
    let userBalance = formatUnits(userBalanceRaw, decimals)
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

  /**
   * Convert the asset into a JSON-safe structure.
   */
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
      organigramId: this.organigramId,
      kind: this.kind,
      decisionProcedure: this.decisionProcedure,
    }
  }
}
