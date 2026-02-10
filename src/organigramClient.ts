import { ethers, type EventLog, type ContractTransaction } from 'ethers'
import OrganigramClientContractABI from '@organigram/protocol/artifacts/contracts/OrganigramClient.sol/OrganigramClient.json'
import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json'
import {
  createRandom32BytesHexId,
  deployedAddresses,
  formatSalt,
  PERMISSIONS
} from './utils'

import Organ, { OrganPermission } from './organ'
import {
  PopulateInitializeInput,
  Procedure,
  ProcedureType,
  ProcedureTypeName
} from './procedure'
import { Organigram } from './organigram'
import { erc20Vote, ERC20VoteProcedure } from './procedure/erc20Vote'
import { nomination, NominationProcedure } from './procedure/nomination'
import { vote, VoteProcedure } from './procedure/vote'

export interface DeployOrganInput {
  cid?: string
  permissions?: OrganPermission[]
  salt?: string
  options?: TransactionOptions
}

export interface DeployProceduresInput {
  typeName: ProcedureTypeName
  chainId?: string | null
  cid?: string | null
  proposers?: string | null
  moderators?: string | null
  deciders: string
  withModeration?: boolean | null
  forwarder?: string | null
  salt?: string | null
  options?: TransactionOptions
  data?: string
  args?: string[]
}

export interface DeployOrganigramInput {
  organs: DeployOrganInput[]
  assets: DeployAssetInput[]
  procedures: DeployProceduresInput[]
}

export interface DeployAssetInput {
  name: string
  symbol: string
  initialSupply?: number | null
  salt?: string | null
}

export interface TransactionOptions {
  nonce?: number
  customData?: { index?: number }
  onTransaction?: (tx: ethers.TransactionResponse, description: string) => void
}

export interface File {
  cid: string
  data: unknown
}

export const procedureTypes = {
  erc20Vote,
  nomination,
  vote
}

const _procedureClasses = {
  erc20Vote: ERC20VoteProcedure,
  nomination: NominationProcedure,
  vote: VoteProcedure
}

export class OrganigramClient {
  address: string
  chainId: string
  procedureTypes: ProcedureType[]
  organs: Organ[]
  procedures: Procedure[]
  cids: File[]
  provider: ethers.Provider
  contract: ethers.Contract
  signer?: ethers.Signer

  /**
   * Creates an instance of Organigram client.
   * @param {string} address - The contract address.
   * @param {string} chainId - The network id.
   * @param {ProcedureType[]} procedureTypes - The procedure types.
   * @param {ethers.Contract} contract - The ethers contract instance.
   * @param {ethers.Provider} provider - The ethers provider.
   * @param {ethers.Signer} [signer] - The ethers signer.
   */
  constructor(input: {
    provider: ethers.Provider
    address?: string
    chainId?: string
    procedureTypes?: ProcedureType[]
    contract?: ethers.Contract
    signer?: ethers.Signer
  }) {
    this.address =
      input?.address ??
      deployedAddresses[input?.chainId as '11155111']?.OrganigramClient ??
      ''
    this.chainId = input?.chainId ?? '11155111'
    this.procedureTypes = input?.procedureTypes ?? Object.values(procedureTypes)
    this.organs = []
    this.procedures = []
    this.cids = []
    this.signer = input?.signer
    this.provider = input?.provider
    this.contract =
      input?.contract ??
      new ethers.Contract(
        input?.address ?? '',
        OrganigramClientContractABI.abi,
        input?.signer ?? input?.provider
      )
  }

  /**
   * Loads a procedure type from registry (a contract address and provider).
   * @param {Object} options - The options object.
   * @param {string} options.addr - The contract address.
   * @param {string} [options.cid] - The IPFS content identifier.
   * @param {ethers.Provider} provider - The ethers provider.
   * @returns {Promise<ProcedureType>} A promise that resolves to a ProcedureType object.
   * @throws {Error} Throws an error if the contract does not support interfaces or is not a procedure.
   */
  static async loadProcedureType(
    { addr, cid }: { addr: string; cid?: string },
    provider: ethers.Provider
  ): Promise<ProcedureType> {
    const contract = new ethers.Contract(
      addr,
      ProcedureContractABI.abi,
      provider
    )
    // @todo : Parse doc for custom parser.
    let metadata
    // @todo : Leverage interfaces or metadata in registry to detect procedure class.
    if (!((await contract.supportsInterface('0x01ffc9a7')) as boolean)) {
      throw new Error('Contract does not support interfaces.')
    }
    if (!((await contract.supportsInterface(Procedure.INTERFACE)) as boolean)) {
      throw new Error('Contract is not a procedure.')
    }
    if (cid === 'nomination' || cid === 'vote' || cid === 'erc20Vote') {
      metadata = procedureTypes[cid as keyof typeof procedureTypes].metadata
    }
    // @todo : If Class is set, test if addr supports the procedure's interface.
    return {
      key: cid ?? '',
      address: addr,
      metadata: {
        ...metadata,
        cid
      }
    }
  }

  /**
   * Loads all procedure types from the registry.
   * @param {string} address - The contract address.
   * @param {ethers.Provider} provider - The ethers provider.
   * @returns {Promise<ProcedureType[]>} A promise that resolves to an array of ProcedureType objects.
   */
  static async loadProcedureTypes(
    provider: ethers.Provider
  ): Promise<ProcedureType[]> {
    const chainId = await provider.getNetwork().then(n => n.chainId.toString())
    const contract = new ethers.Contract(
      deployedAddresses[chainId as '11155111'].OrganigramClient,
      OrganigramClientContractABI.abi,
      provider
    )
    const proceduresRegistryAddress = (
      await contract.proceduresRegistry()
    ).toString()
    const procedures = await Organ.loadEntries(
      proceduresRegistryAddress,
      provider
    )
    const procedureTypes = await Promise.all(
      procedures.map(
        async procedure =>
          await OrganigramClient.loadProcedureType(
            {
              addr: procedure.address,
              cid: procedure.cid
            },
            provider
          )
      )
    ).then((types: Array<ProcedureType | undefined>): ProcedureType[] =>
      types.filter(i => i != null)
    )
    return procedureTypes
  }

  /**
   * Loads an instance of Organigram client.
   * @param {string} address - The contract address.
   * @param {ethers.Provider} provider - The ethers provider.
   * @param {ethers.Signer} [signer] - The ethers signer.
   * @returns {Promise<OrganigramClient>} A promise that resolves to an instance of OrganigramClient  .
   * @throws {Error} Throws an error if no provider or signer is provided.
   */
  static async load(input: {
    provider: ethers.Provider
    signer?: ethers.Signer
    // ipfs?: IPFS
  }): Promise<OrganigramClient> {
    if (input.provider == null && input.signer == null) {
      throw new Error('No provider or signer.')
    }
    const chainId = await input.provider
      .getNetwork()
      .then(n => n.chainId.toString())
      .catch(() => '')
    const contract = new ethers.Contract(
      deployedAddresses[chainId as '11155111'].OrganigramClient,
      OrganigramClientContractABI.abi,
      input.signer ?? input.provider
    )
    const procedureTypes = await OrganigramClient.loadProcedureTypes(
      input.provider
    )
    const newOrganigram = new OrganigramClient({
      chainId,
      procedureTypes,
      contract,
      provider: input.provider,
      signer: input.signer
    })
    return newOrganigram
  }

  // // @todo : Identify contract from on-chain function.
  // public static async checkInterface(address:string) {
  //     // @ts-ignore
  //     const contract = new web3.eth.Contract(Organigram.abi, address)
  //     return contract.checkInterface(interface, interface)
  // }

  /**
   * Instance API.
   */

  // Get master procedure data.
  async getProcedureType(
    procedureAddress: string
  ): Promise<ProcedureType | null> {
    if (this.provider == null) {
      throw new Error('No provider.')
    }
    const code = await this.provider.getCode(procedureAddress).catch(() => '0x')
    const type: string = `0x${code.substring(22, 62)}`.toLowerCase()
    const procedureType = this.procedureTypes.find(
      (pt: ProcedureType) => pt.address.toLowerCase() === type
    )
    return procedureType ?? null
  }

  // Get or load organ data.
  async getOrgan(address: string, cached = true): Promise<Organ> {
    const index = this.organs.findIndex(
      c =>
        c.address.toLowerCase() === address.toLowerCase() &&
        c.chainId === this.chainId
    )
    let organ =
      cached && index > 0 ? this.organs[parseInt(index.toString())] : undefined
    if (organ == null && this.provider != null) {
      organ = await Organ.load(address, this.signer ?? this.provider).catch(
        (error: Error) => {
          console.error('Error loading organ ', address, error.message)
          return undefined
        }
      )
      if (organ != null) {
        if (index >= 0) {
          this.organs[parseInt(index.toString())] = organ
        } else {
          this.organs.push(organ)
        }
      }
    }
    if (organ == null) {
      throw new Error('Organ not found.')
    }
    return organ
  }

  // Get or load procedure data.
  async getProcedure(address: string, cached = true): Promise<Procedure> {
    const procedureType: ProcedureType | null = await this.getProcedureType(
      address
    ).catch((e: Error) => {
      console.error(e.message)
      return null
    })
    if (procedureType == null) {
      throw new Error('Procedure not supported.')
    }
    let procedure = cached && this.procedures.find(c => c.address === address)
    if (procedure == null || procedure === false) {
      const signerOrProvider = this.signer ?? this.provider
      if (signerOrProvider == null) {
        throw new Error('Not connected.')
      }
      const _Class =
        _procedureClasses[procedureType.key as keyof typeof _procedureClasses]
      procedure = await _Class
        .load(address, signerOrProvider)
        .then((p: Procedure) => Object.assign(p, { type: procedureType }))
        .catch((error: Error) => {
          console.error('Unable to load procedure.', error.message)
          return undefined
        })
      if (procedure != null) {
        this.procedures.push(procedure)
      }
    }
    if (procedure == null) {
      throw new Error('Procedure not found.')
    }
    return procedure
  }

  // Get or load a contract.
  // async getContract(
  //   address: string,
  //   cached = true
  // ): Promise<Organ | Procedure | null> {
  //   return (await Organ.isOrgan(address, this.provider))
  //     ? await this.getOrgan(address, cached)
  //     : (await Procedure.isProcedure(address, this.provider))
  //       ? await this.getProcedure(address, cached)
  //       : null
  // }

  // Create and load an organ.
  async deployOrgan(input?: DeployOrganInput): Promise<Organ> {
    const { cid, permissions, salt, options } = input ?? {}
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    let nonce: bigint | undefined
    if (options?.nonce != null) {
      nonce = BigInt(options?.nonce ?? 0)
    }
    const _salt = formatSalt(salt)
    const _permissionAddresses: string[] = []
    const _permissionValues: string[] = []
    if (!permissions || permissions.length === 0) {
      const address = await this.signer.getAddress()
      _permissionAddresses.push(address)
      _permissionValues.push(
        ethers.zeroPadValue(ethers.toBeHex(PERMISSIONS.ADMIN), 2)
      )
    }
    permissions?.forEach((p: OrganPermission) => {
      _permissionAddresses.push(p.permissionAddress)
      _permissionValues.push(
        ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2)
      )
    })
    const tx = await this.contract.deployOrgan(
      _permissionAddresses,
      _permissionValues,
      cid ?? '',
      _salt,
      {
        nonce,
        customData: options?.customData
      }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(tx, `Deploy organ with CID ${cid?.toString()}`)
    }
    const receipt = await tx?.wait()
    const eventCreation = receipt?.logs?.find(
      (e: EventLog) =>
        // e.topics[0] === keccak256('organCreated(address payable organ)')
        e.address !== this.address
    )

    if (eventCreation == null) {
      throw new Error('Organ creation failed.')
    }
    const address: string = eventCreation.address
    return await this.getOrgan(address, false).catch((error: Error) => {
      console.error(
        'Unable to load organ with address ' + address + ' after creating it.',
        error.message
      )
      return { address } as unknown as Organ
    })
  }

  _prepareDeployOrgansInput(deployOrgansInput: DeployOrganInput[]) {
    return deployOrgansInput.map(organ => {
      const _permissionAddresses: string[] = []
      const _permissionValues: string[] = []
      organ.permissions?.forEach(p => {
        _permissionAddresses.push(p.permissionAddress)
        _permissionValues.push(
          ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2)
        )
      })
      return {
        permissionAddresses: _permissionAddresses,
        permissionValues: _permissionValues,
        cid: organ.cid ?? '',
        salt: organ.salt ?? createRandom32BytesHexId()
      }
    })
  }

  async deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const input = this._prepareDeployOrgansInput(deployOrgansInput)
    const tx = await this.contract.deployOrgans(input)

    const receipt = await tx?.wait()
    const eventCreations = receipt?.logs?.filter(
      (e: EventLog) =>
        // e.topics[0] === keccak256('organCreated(address payable organ)')
        e.address !== this.address
    )

    if (eventCreations == null || eventCreations.length === 0) {
      throw new Error('Organ deployment failed.')
    }
    const addresses: string[] = eventCreations.map(
      (eventCreation: EventLog) => eventCreation.address
    )
    return await Promise.all(
      addresses.map(
        async address =>
          await this.getOrgan(address, false).catch((error: Error) => {
            console.error(
              'Unable to load organ with address ' +
                address +
                ' after deploying it in batch.',
              error.message
            )
            return { address } as unknown as Organ
          })
      )
    )
  }

  async deployAsset(
    name: string,
    symbol: string,
    initialSupply: number,
    salt?: string,
    options?: TransactionOptions
  ): Promise<string> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    // let nonce: bigint | undefined
    // if (options?.nonce != null) {
    //   nonce = BigInt(options?.nonce)
    // }
    const tx = await this.contract.deployAsset(
      name,
      symbol,
      initialSupply,
      formatSalt(salt)
      // {
      //   nonce,
      //   customData: options?.customData
      // }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(tx, `Create asset ${name} (${symbol})`)
    }
    const receipt = await tx?.wait()
    const address = receipt?.logs?.find(
      (e: EventLog) => e.address !== this.address
    ).address
    if (address == null) {
      throw new Error('Asset creation failed.')
    }
    return address
  }

  async deployAssets(
    assets: DeployAssetInput[],
    options?: TransactionOptions
  ): Promise<string[]> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const formattedAssets = assets.map(asset => ({
      name: asset.name,
      symbol: asset.symbol,
      initialSupply: asset.initialSupply,
      salt: formatSalt(asset.salt)
    }))
    const tx = await this.contract.deployAssets(formattedAssets, {
      customData: options?.customData,
      nonce: options?.nonce != null ? BigInt(options.nonce) : undefined
    })
    if (options?.onTransaction != null) {
      options.onTransaction(tx, `Deploy ${assets.length} assets`)
    }
    const receipt = await tx?.wait()
    const eventCreations = receipt?.logs?.filter(
      (e: EventLog) => e.address !== this.address
    )

    if (eventCreations == null || eventCreations.length === 0) {
      throw new Error('Asset batch deployments failed.')
    }

    const addresses: string[] = eventCreations.map(
      (eventCreation: EventLog) => eventCreation.address
    )
    return addresses
  }

  async _deployProcedure({
    typeAddress,
    initialize,
    salt,
    options
  }: {
    typeAddress: string
    initialize: ethers.ContractTransaction
    salt?: string
    options?: TransactionOptions
  }): Promise<string | null> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    let nonce: bigint | undefined
    if (options?.nonce != null) {
      nonce = BigInt(options?.nonce)
    }
    const _salt = formatSalt(salt)
    const tx = await this.contract.deployProcedure(
      typeAddress,
      initialize?.data,
      _salt,
      { nonce, customData: options?.customData }
    )
    if (options?.onTransaction != null) {
      options.onTransaction(
        tx,
        `Deploy procedure of type ${this.procedureTypes?.find(pt => pt.address.toLowerCase() === typeAddress.toLowerCase())?.metadata.label ?? typeAddress}.`
      )
    }
    const receipt = await tx?.wait()
    const address = receipt?.logs?.find(
      (e: EventLog) => e.address !== this.address
    ).address
    if (address == null) {
      throw new Error('Procedure deployment failed.')
    }
    return address
  }

  // async _initializeProcedure(
  //   address: string,
  //   type: string,
  //   options: TransactionOptions,
  //   metadata: string,
  //   proposers: string,
  //   moderators: string,
  //   deciders: string,
  //   withModeration: boolean,
  //   forwarder: string,
  //   ...args: unknown[]
  // ): Promise<Procedure> {
  //   if (this.signer == null) {
  //     throw new Error('Signer not connected.')
  //   }
  //   const initialize = await this._populateInitializeProcedure(
  //     type,
  //     options,
  //     metadata,
  //     proposers,
  //     moderators,
  //     deciders,
  //     withModeration,
  //     forwarder,
  //     ...args
  //   )
  //   if (initialize?.data == null) {
  //     throw new Error('Could not initialize procedure.')
  //   }
  //   const tx = await this.signer.sendTransaction({
  //     from: this.signer.getAddress(),
  //     to: address,
  //     data: initialize.data
  //   })
  //   if (options?.onTransaction != null) {
  //     options.onTransaction(tx, `Initialize procedure ${address}`)
  //   }
  //   await tx.wait()
  //   return await this.getProcedure(address, true)
  // }

  async _populateInitializeProcedure(
    input: PopulateInitializeInput
  ): Promise<ContractTransaction> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const procedureClass =
      _procedureClasses[input.typeName as keyof typeof _procedureClasses]
    if (procedureClass == null) {
      throw new Error(
        'Populate initialize procedure: Procedure type not found.'
      )
    }
    try {
      return await procedureClass._populateInitialize({
        options: { ...input.options, signer: this.signer },
        cid: input.cid ?? input.typeName,
        proposers: input.proposers ?? input.deciders,
        moderators: input.moderators ?? ethers.ZeroAddress,
        deciders: input.deciders,
        withModeration: input.withModeration ?? false,
        forwarder:
          input.forwarder ??
          deployedAddresses[this.chainId as '11155111']?.MetaGasStation,
        args: input.args
      })
    } catch (error) {
      console.error('populateInitializeProcedure', (error as Error).message)
      throw error
    }
  }

  // Create and load a procedure.
  async deployProcedure(input: DeployProceduresInput): Promise<Procedure> {
    const initializeProcedure = await this._populateInitializeProcedure({
      typeName: input.typeName,
      options: input.options ?? {},
      cid: input.cid ?? input.typeName,
      deciders: input.deciders,
      proposers: input.proposers ?? input.deciders,
      moderators: input.moderators ?? ethers.ZeroAddress,
      withModeration: input.withModeration ?? false,
      forwarder:
        input.forwarder ??
        deployedAddresses[this.chainId as '11155111']?.MetaGasStation,
      args: input.args ?? []
    })
    const address = await this._deployProcedure({
      typeAddress:
        procedureTypes[input.typeName as keyof typeof procedureTypes].address,
      initialize: initializeProcedure,
      salt: input.salt ?? createRandom32BytesHexId(),
      options: input.options ?? {}
    })
    return await this.getProcedure(address!, false).catch((error: Error) => {
      throw new Error(
        'Unable to load procedure with address ' +
          address +
          ' after creating it.' +
          error.message
      )
    })
  }

  async _prepareDeployProceduresInput(
    deployProceduresInput: DeployProceduresInput[]
  ) {
    return await Promise.all(
      deployProceduresInput.map(async procedure => {
        if (
          procedure.typeName !== 'nomination' &&
          procedure.data == null &&
          procedure.args == null
        ) {
          throw new Error(
            'At least one of "data" or "args" fields must be present in ' +
              procedure.typeName +
              ' procedure input.'
          )
        }
        const parsedData = procedure.data ? JSON.parse(procedure.data) : {}
        const _args = procedure.args ?? Object.values(parsedData)
        const initialize = await this._populateInitializeProcedure({
          typeName: procedure.typeName,
          options: procedure.options ?? {},
          cid: procedure.cid ?? procedure.typeName,
          moderators: procedure.moderators ?? ethers.ZeroAddress,
          deciders: procedure.deciders,
          proposers: procedure.proposers ?? procedure.deciders,
          withModeration: procedure.withModeration ?? false,
          forwarder:
            deployedAddresses[procedure.chainId as '11155111']?.MetaGasStation,
          args: _args
        })
        return {
          procedureType:
            procedureTypes[procedure.typeName as keyof typeof procedureTypes]
              .address,
          data: initialize.data,
          salt: formatSalt(procedure.salt),
          options: procedure.options
        }
      })
    )
  }

  async deployProcedures(
    deployProceduresInput: DeployProceduresInput[]
  ): Promise<Procedure[]> {
    const input = await this._prepareDeployProceduresInput(
      deployProceduresInput
    )
    const tx = await this.contract.deployProcedures(input, {})

    const receipt = await tx?.wait()
    const eventCreations = receipt?.logs?.filter(
      (e: EventLog) =>
        // e.topics[0] ===
        // ethers.keccak256(
        //   ethers.toUtf8Bytes(
        //     'procedureCreated(address procedureType, address procedure)'
        //   )
        // )
        e.address !== this.address
    )

    if (eventCreations == null || eventCreations.length === 0) {
      throw new Error('Procedure batch creations failed.')
    }

    const addresses: string[] = eventCreations.map(
      (eventCreation: EventLog) => eventCreation.address
    )

    return await Promise.all(
      addresses.map(
        async address =>
          await this.getProcedure(address, false).catch((error: Error) => {
            console.error(
              'Unable to load procedure with address ' +
                address +
                ' after creating it.',
              error.message
            )
            return { address } as unknown as Procedure
          })
      )
    )
  }

  async deployOrganigram(
    input: DeployOrganigramInput
  ): Promise<ContractTransaction> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const formattedAssets = input.assets.map(asset => ({
      name: asset.name,
      symbol: asset.symbol,
      initialSupply: asset.initialSupply,
      salt: formatSalt(asset.salt)
    }))
    const organsInput = this._prepareDeployOrgansInput(input.organs)
    const proceduresInput = await this._prepareDeployProceduresInput(
      input.procedures
    )

    const deployedAddresses = await this.contract.deployOrganigram.staticCall(
      organsInput,
      formattedAssets,
      proceduresInput
    )

    const tx = await this.contract.deployOrganigram(
      organsInput,
      formattedAssets,
      proceduresInput
    )

    await tx?.wait()

    return deployedAddresses
  }

  loadOrganigram(
    organigram: Organigram,
    cached = true,
    options: { discover: boolean; limit: number } = {
      discover: true,
      limit: 100
    }
  ): Organigram {
    // // Load organs
    // organigram.organs = []
    // // @todo : implement pagination with limit and offset.
    // this.contract
    //   .getOrgans()
    //   .then(async (organAddresses: string[]) => {
    //     for (const address of organAddresses) {
    //       const organ = await this.getOrgan(address, cached).catch(
    //         (error: Error) => {
    //           console.error('Error loading organ ' + address, error.message)
    //           return undefined
    //         }
    //       )
    //       if (organ != null) {
    //         organigram.organs.push(getOrganSourcesAndTargets(organ, organigram))
    //       }
    //     }
    //   })
    //   .catch((error: Error) => {
    //     console.error('Error fetching organs', error.message)
    //   })

    // // Load procedures
    // organigram.procedures = []
    // // @todo : implement pagination with limit and offset.
    // this.contract
    //   .getProcedures()
    //   .then(async (procedureAddresses: string[]) => {
    //     for (const address of procedureAddresses) {
    //       const procedure = await this.getProcedure(address, cached).catch(
    //         (error: Error) => {
    //           console.error('Error loading procedure ' + address, error.message)
    //           return undefined
    //         }
    //       )
    //       if (procedure != null) {
    //         organigram.procedures.push(getProcedureSourcesAndTargets(procedure, organigram))
    //       }
    //     }
    //   })
    //   .catch((error: Error) => {
    //     console.error('Error fetching procedures', error.message)
    //   })

    return organigram
  }
}

export default OrganigramClient
