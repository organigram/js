import AssetContract from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json'
import {
  type Contract as EthersContract,
  ethers,
  type Signer,
  Interface,
  formatEther
} from 'ethers'
import { SourceOrgan } from './organigram'
import { Contract } from 'ethers'
import { createRandom32BytesHexId, predictContractAddress } from './utils'

export const ERC20_INITIAL_SUPPLY = 10_000_000 // 10 million tokens.

export interface AssetJson {
  address: string
  isDeployed: boolean
  name: string
  symbol: string
  totalSupply: string
  chainId: string
  salt?: string | null
  image?: string | null
  isSourceOrgan: SourceOrgan[]
  userBalance: string
}

export interface AssetInput {
  name?: string | null
  description?: string | null
  address?: string | null
  contract?: EthersContract | null
  symbol?: string | null
  totalSupply?: string | null
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
  totalSupply: string
  chainId: string
  salt?: string | null
  isSourceOrgan: SourceOrgan[]
  image?: string | null
  isDeployed: boolean
  userBalance: string

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
      (input.salt ?? this.isDeployed) ? undefined : createRandom32BytesHexId()
    this.chainId = input.chainId ?? '11155111'
    this.address =
      input.address ??
      predictContractAddress({
        type: 'Asset',
        chainId: this.chainId!,
        salt: this.salt!
      })
    this.symbol = input.symbol ?? 'ASSET'
    this.totalSupply = input.totalSupply ?? (10_000_000).toString()
    this.isSourceOrgan = input.isSourceOrgan ?? []
    this.image = input.image ?? undefined
    this.userBalance = input.userBalance ?? '0'
  }

  load = async (
    signer?: Signer | null
  ): Promise<(Asset & { userBalance: string }) | undefined> => {
    const erc777Interface = new Interface(AssetContract.abi)
    const contract = new ethers.Contract(this.address, erc777Interface, signer)
    const name = await contract.name()
    const symbol = await contract.symbol()
    const _totalSupply = await contract.totalSupply()
    let totalSupply = formatEther(_totalSupply)
    totalSupply = (+totalSupply).toFixed(0)
    const _userBalance = await contract.balanceOf(await signer?.getAddress())
    let userBalance = formatEther(_userBalance)
    userBalance = (+userBalance).toFixed(0)
    if (contract != null) {
      return new Asset({
        address: this.address,
        contract,
        name,
        symbol,
        totalSupply,
        userBalance,
        chainId: (await signer?.provider?.getNetwork())?.chainId.toString()!,
        isDeployed: true
      })
    }
  }

  deploy = async (signer?: Signer | null): Promise<Contract> => {
    const erc777Interface = new ethers.Interface(AssetContract.abi)
    const factory = new ethers.ContractFactory(
      erc777Interface,
      AssetContract.bytecode,
      signer
    )
    const contract = await factory.deploy(BigInt(ERC20_INITIAL_SUPPLY))

    await contract.waitForDeployment()
    return contract as Contract
  }

  toJson(): AssetJson {
    return {
      address: this.address,
      name: this.name,
      symbol: this.symbol,
      totalSupply: this.totalSupply,
      chainId: this.chainId!,
      salt: this.salt,
      image: this.image,
      isDeployed: this.isDeployed,
      isSourceOrgan: this.isSourceOrgan,
      userBalance: this.userBalance
    }
  }
}
