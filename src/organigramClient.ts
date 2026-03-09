import {
  ethers,
  type EventLog,
  type ContractTransaction,
  parseEther
} from 'ethers'
import OrganLibraryContractABI from '@organigram/protocol/artifacts/contracts/libraries/OrganLibrary.sol/OrganLibrary.json'
import OrganigramClientContractABI from '@organigram/protocol/artifacts/contracts/OrganigramClient.sol/OrganigramClient.json'
import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json'
import { createRandom32BytesHexId, deployedAddresses, formatSalt, PERMISSIONS } from './utils'

import { Organ, OrganEntry, OrganInput, OrganPermission } from './organ'
import { Procedure, ProcedureInput, ProcedureType } from './procedure'
import { Organigram } from './organigram'
import {
  getProcedureClass,
  populateInitializeProcedure,
  prepareDeployOrgansInput,
  prepareDeployProceduresInput,
  ProcedureTypeName,
  procedureTypes
} from './procedure/utils'
import { Asset, ERC20_INITIAL_SUPPLY } from './asset'

export interface DeployOrganInput {
  cid?: string
  permissions?: OrganPermission[]
  entries?: OrganEntry[]
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

const linkContractBytecode = (
  bytecode: string,
  linkReferences: Record<
    string,
    Record<string, Array<{ start: number; length: number }>>
  >,
  libraries: Record<string, string>
): string => {
  let linkedBytecode = bytecode

  for (const contracts of Object.values(linkReferences)) {
    for (const [name, references] of Object.entries(contracts)) {
      const address = libraries[name]
      if (address == null) {
        throw new Error(`Missing linked library address for ${name}.`)
      }
      const normalizedAddress = address.toLowerCase().slice(2)

      for (const reference of references) {
        const start = 2 + reference.start * 2
        const end = start + reference.length * 2
        linkedBytecode =
          linkedBytecode.slice(0, start) +
          normalizedAddress +
          linkedBytecode.slice(end)
      }
    }
  }

  return linkedBytecode
}

export class OrganigramClient {
  address: string
  chainId: string
  procedureTypes: ProcedureType[]
  organs: Organ[]
  procedures: Procedure[]
  assets: Asset[]
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
    const resolvedAddress =
      input?.address ??
      (input?.contract?.target as string | undefined) ??
      deployedAddresses[input?.chainId as '11155111']?.OrganigramClient
    if (input?.contract == null && !resolvedAddress) {
      throw new Error(
        'OrganigramClient address not configured. Provide an address or a chainId with deployments.'
      )
    }
    this.address = resolvedAddress ?? ''
    this.chainId = input?.chainId ?? '11155111'
    this.procedureTypes = input?.procedureTypes ?? Object.values(procedureTypes)
    this.organs = []
    this.procedures = []
    this.assets = []
    this.cids = []
    this.signer = input?.signer
    this.provider = input?.provider
    this.contract =
      input?.contract ??
      new ethers.Contract(
        resolvedAddress!,
        OrganigramClientContractABI.abi,
        input?.signer ?? input?.provider
      )
  }

  static async deployClient(
    signer: ethers.Signer
  ): Promise<OrganigramClient> {
    const network = await signer.provider?.getNetwork()
    const organLibraryFactory = new ethers.ContractFactory(
      OrganLibraryContractABI.abi,
      OrganLibraryContractABI.bytecode,
      signer
    )
    const organLibrary = await organLibraryFactory.deploy()
    await organLibrary.waitForDeployment()
    const linkedBytecode = linkContractBytecode(
      OrganigramClientContractABI.bytecode,
      OrganigramClientContractABI.linkReferences,
      {
        OrganLibrary: await organLibrary.getAddress()
      }
    )
    const factory = new ethers.ContractFactory(
      OrganigramClientContractABI.abi,
      linkedBytecode,
      signer
    )
    const contract = await factory.deploy(
      '',
      ethers.ZeroAddress,
      createRandom32BytesHexId()
    )
    await contract.waitForDeployment()
    const clientContract = new ethers.Contract(
      await contract.getAddress(),
      OrganigramClientContractABI.abi,
      signer
    )
    return new OrganigramClient({
      provider: signer.provider!,
      signer,
      chainId: network?.chainId.toString(),
      contract: clientContract
    })
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
  static async loadProcedureTypes({
    address,
    provider
  }: {
    provider: ethers.Provider
    address?: string
  }): Promise<ProcedureType[]> {
    const chainId = await provider.getNetwork().then(n => n.chainId.toString())
    const contract = new ethers.Contract(
      address ?? deployedAddresses[chainId as '11155111'].OrganigramClient,
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
   * Loads an onchain instance of Organigram client.
   * @param {string} address - The client address.
   * @param {ethers.Provider} provider - The ethers provider.
   * @param {ethers.Signer} [signer] - The ethers signer.
   * @returns {Promise<OrganigramClient>} A promise that resolves to an instance of OrganigramClient  .
   * @throws {Error} Throws an error if no provider or signer is provided.
   */
  static async load(input: {
    address?: string
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
      input.address ??
        deployedAddresses[chainId as '11155111'].OrganigramClient,
      OrganigramClientContractABI.abi,
      input.signer ?? input.provider
    )
    const procedureTypes = await OrganigramClient.loadProcedureTypes(
      input.provider
    )
    const newOrganigramClient = new OrganigramClient({
      chainId,
      procedureTypes,
      contract,
      provider: input.provider,
      signer: input.signer
    })
    return newOrganigramClient
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
    if (this.provider == null || this.signer == null) {
      throw new Error('No provider or signer.')
    }
    const code = await (this.provider ?? this.signer.provider)?.getCode(
      procedureAddress
    )
    const type: string = `0x${code?.substring(22, 62)}`.toLowerCase()
    const procedureType = this.procedureTypes.find(
      (pt: ProcedureType) => pt.address.toLowerCase() === type
    )
    if (procedureType == null) {
      throw new Error('getProcedureType: Procedure not supported.')
    }
    return procedureType
  }

  // Get or load organ data.
  async getDeployedOrgan(
    address: string,
    cached = true,
    initialOrgan?: OrganInput
  ): Promise<Organ> {
    const index = this.organs.findIndex(
      c =>
        c.address.toLowerCase() === address.toLowerCase() &&
        c.chainId === this.chainId
    )
    let organ = cached && index >= 0 ? this.organs[index] : undefined
    if (organ == null && this.provider != null) {
      organ = await Organ.load(
        address,
        this.signer ?? this.provider,
        initialOrgan
      ).catch((error: Error) => {
        console.error('Error loading organ ', address, error.message)
        return undefined
      })
      if (organ != null) {
        if (index >= 0) {
          this.organs[index] = organ
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

  async getDeployedAsset(
    address: string,
    cached = true,
    initialAsset?: Asset
  ): Promise<Asset> {
    const index = this.assets.findIndex(
      c =>
        c.address.toLowerCase() === address.toLowerCase() &&
        c.chainId === this.chainId
    )
    let asset = cached && index >= 0 ? this.assets[index] : undefined
    if (asset == null && this.provider != null) {
      asset = await Asset.load(address, this.signer, initialAsset).catch(
        (error: Error) => {
          console.error('Error loading asset ', address, error.message)
          return undefined
        }
      )
      if (asset != null) {
        if (index >= 0) {
          this.assets[index] = asset
        } else {
          this.assets.push(asset)
        }
      }
    }
    if (asset == null) {
      throw new Error('Asset not found.')
    }
    return asset
  }

  // Get or load procedure data.
  async getDeployedProcedure(
    address: string,
    cached = true,
    initialProcedure?: ProcedureInput
  ): Promise<Procedure> {
    const procedureType =
      initialProcedure?.type ??
      procedureTypes[
        initialProcedure?.typeName as keyof typeof procedureTypes
      ] ??
      (await this.getProcedureType(address).catch((e: Error) => {
        console.error(e.message)
        return null
      }))

    if (procedureType == null) {
      throw new Error('getDeployedProcedure: Procedure not supported.')
    }
    let procedure = cached
      ? this.procedures.find(c => c.address === address)
      : undefined
    if (procedure == null) {
      const signerOrProvider = this.signer ?? this.provider
      if (signerOrProvider == null) {
        throw new Error('Not connected.')
      }
      const _Class = await getProcedureClass(procedureType.key)
      procedure = await _Class
        .load(address, signerOrProvider, initialProcedure)
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

  // Create and load an organ.
  async deployOrgan(input?: DeployOrganInput): Promise<Organ> {
    const { cid, permissions, salt, entries, options } = input ?? {}
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
    const _entries =
      entries?.map((e: OrganEntry) => ({
        addr: e.address,
        cid: e.cid ?? ''
      })) ?? []
    const tx = await this.contract.deployOrgan(
      _permissionAddresses,
      _permissionValues,
      cid ?? '',
      _entries,
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
    return await this.getDeployedOrgan(address, false).catch((error: Error) => {
      console.error(
        'Unable to load organ with address ' + address + ' after creating it.',
        error.message
      )
      return { address } as unknown as Organ
    })
  }

  async deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const input = prepareDeployOrgansInput(deployOrgansInput)
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
          await this.getDeployedOrgan(address, false).catch((error: Error) => {
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
      parseEther(initialSupply.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
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
      initialSupply: parseEther(
        asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()
      ),
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

    const addresses: string[] = [
      ...new Set<string>(
        eventCreations.map((eventCreation: EventLog) => eventCreation.address)
      )
    ]
    return addresses
  }

  async deployProcedure(input: DeployProceduresInput): Promise<Procedure> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const initializeProcedure = await populateInitializeProcedure(
      {
        typeName: input.typeName,
        options: input.options ?? {},
        cid: input.cid ?? '',
        deciders: input.deciders,
        proposers: input.proposers ?? input.deciders,
        moderators: input.moderators ?? ethers.ZeroAddress,
        withModeration: input.withModeration ?? false,
        forwarder:
          input.forwarder ??
          deployedAddresses[this.chainId as '11155111']?.MetaGasStation,
        args: input.args ?? []
      },
      this.signer
    )
    const typeAddress =
      procedureTypes[input.typeName as keyof typeof procedureTypes].address
    let nonce: bigint | undefined
    if (input.options?.nonce != null) {
      nonce = BigInt(input.options?.nonce)
    }
    const _salt = formatSalt(input.salt)
    const tx = await this.contract.deployProcedure(
      typeAddress,
      initializeProcedure?.data,
      _salt,
      { nonce, customData: input.options?.customData }
    )
    if (input.options?.onTransaction != null) {
      input.options.onTransaction(
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
    return await this.getDeployedProcedure(address!, false).catch(
      (error: Error) => {
        throw new Error(
          'Unable to load procedure with address ' +
            address +
            ' after creating it.' +
            error.message
        )
      }
    )
  }

  async deployProcedures(
    deployProceduresInput: DeployProceduresInput[]
  ): Promise<Procedure[]> {
    if (this.signer == null) {
      throw new Error('Signer not connected.')
    }
    const input = await prepareDeployProceduresInput(
      deployProceduresInput,
      this.signer
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
          await this.getDeployedProcedure(address, false).catch(
            (error: Error) => {
              console.error(
                'Unable to load procedure with address ' +
                  address +
                  ' after creating it.',
                error.message
              )
              return { address } as unknown as Procedure
            }
          )
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
      initialSupply: parseEther(
        asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()
      ),
      salt: formatSalt(asset.salt)
    }))
    const organsInput = prepareDeployOrgansInput(input.organs)
    const proceduresInput = await prepareDeployProceduresInput(
      input.procedures,
      this.signer
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

  // Get or load a deployed contract (organ or procedure).
  async loadContract(
    address: string,
    cached = true
  ): Promise<Organ | Procedure | null> {
    return (
      (await this.getDeployedOrgan(address, cached)) ??
      (await this.getDeployedProcedure(address, cached))
    )
  }

  async loadContracts(contractAddresses: string[]): Promise<Organigram> {
    const organs: Organ[] = []
    const procedures: Procedure[] = []
    const assets: Asset[] = []
    for (const address of contractAddresses) {
      try {
        const organ = await this.getDeployedOrgan(address)
        if (organ != null) {
          organs.push(organ)
          continue
        }
        const procedure = await this.getDeployedProcedure(address)
        if (procedure != null) {
          procedures.push(procedure)
          continue
        }
        const asset = await this.getDeployedAsset(address)
        if (asset != null) {
          assets.push(asset)
          continue
        }
        console.warn(
          'Contract with address ' +
            address +
            ' not found as organ or procedure. Skipping...'
        )
      } catch (error) {
        console.error(
          'Unable to load contract with address ' + address,
          (error as Error).message
        )
      }
    }
    return new Organigram({
      organs,
      procedures,
      assets
    })
  }

  async loadOrganigram(
    organigram: Organigram,
    cached = true
    // options: { discover: boolean; limit: number } = {
    //   discover: true,
    //   limit: 100
    // }
  ): Promise<Organigram> {
    // Load organs
    const deployedOrgans = []
    for (const organ of organigram.organs) {
      if (
        !organ.isDeployed ||
        !organ.address ||
        !ethers.isAddress(organ.address)
      ) {
        deployedOrgans.push(organ)
        continue
      }
      {
        const deployed = await this.getDeployedOrgan(
          organ.address,
          cached,
          organ
        )
        if (deployed != null) {
          deployedOrgans.push(deployed)
        }
      }
    }
    // Load procedures
    const deployedProcedures = []
    // @todo : implement pagination with limit and offset.
    for (const procedure of organigram.procedures) {
      deployedProcedures.push(
        !procedure.isDeployed ||
          !procedure.address ||
          !ethers.isAddress(procedure.address)
          ? procedure
          : (this.procedures.find(p => p.address === procedure.address) ??
              (await this.getDeployedProcedure(
                procedure.address,
                cached,
                procedure
              )) ??
              procedure)
      )
    }
    // Load assets
    const deployedAssets = []
    for (const asset of organigram.assets) {
      if (
        !asset.isDeployed ||
        !asset.address ||
        !ethers.isAddress(asset.address)
      ) {
        deployedAssets.push(asset)
        continue
      }
      const deployed = await this.getDeployedAsset(asset.address, cached, asset)
      if (deployed != null) {
        deployedAssets.push(deployed)
      }
    }

    const newOrganigram = {
      ...organigram,
      organs: deployedOrgans,
      procedures: deployedProcedures,
      assets: deployedAssets
    }

    return new Organigram(newOrganigram)
  }
}

export default OrganigramClient
