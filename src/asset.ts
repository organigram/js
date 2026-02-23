import AssetContract from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json'
import {
  type Contract as EthersContract,
  ethers,
  type Signer,
  formatEther
} from 'ethers'
import { SourceOrgan } from './organigram'
import { createRandom32BytesHexId, predictContractAddress } from './utils'

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
  isSourceOrgan: SourceOrgan[]
  userBalance: string
  organigramId?: string | null
}

export interface AssetInput {
  name?: string | null
  description?: string | null
  address?: string | null
  contract?: EthersContract | null
  symbol?: string | null
  initialSupply?: number | null
  chainId?: string | null
  salt?: string | null
  isSourceOrgan?: SourceOrgan[]
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
  isSourceOrgan: SourceOrgan[]
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
        chainId: this.chainId!,
        salt: this.salt!
      })
    this.symbol = input.symbol ?? 'ASSET'
    this.initialSupply = input.initialSupply ?? ERC20_INITIAL_SUPPLY
    this.isSourceOrgan = input.isSourceOrgan ?? []
    this.image = input.image ?? undefined
    this.userBalance = input.userBalance ?? '0'
    this.organigramId = input.organigramId ?? null
  }

  static load = async (
    address: string,
    signer?: Signer | null,
    initilAsset?: AssetInput
  ): Promise<(Asset & { userBalance: string }) | undefined> => {
    if (!address) {
      throw new Error('Cannot load asset: No address provided.')
    }
    const contract = new ethers.Contract(address, AssetContract.abi, signer)
    const name = await contract.name()
    const symbol = await contract.symbol()
    const _initialSupply = await contract.totalSupply()
    const initialSupply = parseInt((+formatEther(_initialSupply)).toFixed(0))
    const _userBalance =
      (await contract.balanceOf(await signer?.getAddress())) ?? 0
    let userBalance = formatEther(_userBalance)
    userBalance = (+userBalance).toFixed(0)
    if (contract != null) {
      return new Asset({
        ...initilAsset,
        address,
        contract,
        name,
        symbol,
        initialSupply,
        userBalance,
        chainId: (await signer?.provider?.getNetwork())?.chainId.toString()!,
        isDeployed: true
      })
    }
  }

  toJson(): AssetJson {
    return {
      address: this.address,
      name: this.name,
      symbol: this.symbol,
      initialSupply: this.initialSupply,
      chainId: this.chainId!,
      salt: this.salt,
      image: this.image,
      isDeployed: this.isDeployed,
      isSourceOrgan: this.isSourceOrgan,
      userBalance: this.userBalance,
      organigramId: this.organigramId
    }
  }
}
