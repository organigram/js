import deployedAddresses from '@organigram/protocol/deployments.json' with { type: 'json' }
import AssetContractABI from '@organigram/protocol/abi/Asset.sol/Asset.json' with { type: 'json' }
import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  isAddress,
  parseEther,
  type Address,
  type PublicClient,
  type WalletClient
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'

import {
  type ContractClients,
  ERC20_INITIAL_SUPPLY,
  Organ,
  OrganigramClient,
  predictContractAddress,
  ProcedureProposalOperation
} from '../src'
import { type TransactionOptions } from '../src/organigramClient'
import { createRandom32BytesHexId, PERMISSIONS } from '../src/utils'
import { NominationProcedure } from '../src/procedure/nomination'
import { VoteProcedure } from '../src/procedure/vote'
import { ERC20VoteProcedure } from '../src/procedure/erc20Vote'

const ERC20_EXAMPLE = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC

const txOptions: TransactionOptions = {
  onTransaction: (tx, description) => {}
}

describe('Organigram JS Client', () => {
  let publicClient: PublicClient
  let walletClient: WalletClient
  let clients: ContractClients
  let signerAddress: Address
  // let ipfs: IPFS.IPFS
  let organ: Organ
  let asset: string

  beforeEach(async () => {
    // ipfs = await loadIpfs()
    publicClient = createPublicClient({
      chain: sepolia,
      transport: http('http://127.0.0.1:8545/')
    })
    walletClient = createWalletClient({
      chain: sepolia,
      transport: http('http://127.0.0.1:8545/')
    })
    signerAddress = (await walletClient.getAddresses())[0] as Address
    clients = {
      publicClient,
      walletClient
    }
    await Promise.resolve()
  })

  describe('Web3', () => {
    it('should connect Web3 to a provider', async () => {
      const chainId = await publicClient.getChainId()

      expect(chainId).toBe(11155111)
    })

    it('should provide signer with funds', async () => {
      const chainId = await publicClient.getChainId()
      const balance = await publicClient.getBalance({ address: signerAddress })

      expect(chainId).toBe(11155111)
      expect(signerAddress).not.toBeNull()
      expect(balance).toBeGreaterThan(0n)
    })
  })

  describe('Protocol', () => {
    let organigramClient: OrganigramClient

    beforeEach(async () => {
      organigramClient = await OrganigramClient.load({
        publicClient,
        walletClient
      })
    })

    it('should connect to the deployed client', async () => {
      expect(organigramClient?.address).not.toBeNull()
    })

    it('should create an organ', async () => {
      organ = await organigramClient.deployOrgan()
      expect(organ?.address).not.toBeNull()
    })

    it('should create organs in batch', async () => {
      const organs = await organigramClient.deployOrgans([{}, {}])
      expect(organs?.length).toBe(2)
    })

    it('should deploy an ERC20 asset', async () => {
      asset = await organigramClient.deployAsset(
        'ERC20',
        'ERC',
        ERC20_INITIAL_SUPPLY,
        undefined,
        txOptions
      )
      expect(isAddress(asset)).toBe(true)
    })

    it('should deploy assets in batch', async () => {
      const assets = await organigramClient.deployAssets(
        [
          {
            name: 'ERC20_1',
            symbol: 'ERC'
          },
          {
            name: 'ERC20_2',
            symbol: 'ERC'
          }
        ],
        txOptions
      )
      expect(assets?.length).toBe(2)
      expect(isAddress(assets[0])).toBe(true)
    })

    it('should deposit ether into an organ', async () => {
      const amount = parseEther('0.01')
      const hash = await walletClient.sendTransaction({
        account: signerAddress,
        to: organ.address as Address,
        value: amount,
        chain: sepolia
      })

      await publicClient.waitForTransactionReceipt({ hash })

      expect(
        await publicClient.getBalance({ address: organ.address as Address })
      ).toBe(amount)
    })

    it('should withdraw ether from an organ', async () => {
      const amount = parseEther('0.01')
      const recipientAddress = privateKeyToAccount(generatePrivateKey()).address
      const receipt = await organ.withdrawEther(
        recipientAddress,
        amount,
        txOptions
      )

      expect(
        await publicClient.getBalance({
          address: organ.address as Address,
          blockNumber: receipt.blockNumber
        })
      ).toBe(0n)
      expect(
        await publicClient.getBalance({
          address: recipientAddress,
          blockNumber: receipt.blockNumber
        })
      ).toBe(amount)
    })

    it('should withdraw ERC20 tokens from an organ', async () => {
      const recipientAddress = privateKeyToAccount(generatePrivateKey()).address
      const amount = parseEther('15')
      const assetContract = getContract({
        address: asset as Address,
        abi: AssetContractABI.abi,
        client: {
          public: publicClient,
          wallet: walletClient
        }
      })

      const transferHash = await assetContract.write.transfer(
        [organ.address as Address, amount],
        { account: signerAddress }
      )
      await publicClient.waitForTransactionReceipt({ hash: transferHash })

      expect(
        await assetContract.read.balanceOf([organ.address as Address])
      ).toBe(amount)

      await organ.withdrawERC20(asset, recipientAddress, amount, txOptions)

      expect(
        await assetContract.read.balanceOf([organ.address as Address])
      ).toBe(0n)
      expect(
        await assetContract.read.balanceOf([recipientAddress])
      ).toBe(amount)
      })

    it('should deploy procedures in batch', async () => {
      const address = signerAddress
      const procedures = await organigramClient.deployProcedures([
        {
          typeName: 'nomination',
          deciders: address
        },
        {
          typeName: 'vote',
          deciders: address,
          args: ['1', '8', '1']
        }
      ])
      expect(procedures?.length).toBe(2)
    })

    it('should deploy test organigram', async () => {
      const address = signerAddress
      const organigram = await organigramClient.deployOrganigram({
        organs: [{}, {}],
        assets: [
          {
            name: 'ERC20_Organigram',
            symbol: 'ERC',
            initialSupply: ERC20_INITIAL_SUPPLY
          }
        ],
        procedures: [
          {
            typeName: 'nomination',
            cid: '',
            proposers: address,
            moderators: address,
            deciders: address,
            withModeration: false
          },
          {
            typeName: 'vote',
            cid: '',
            proposers: address,
            moderators: address,
            deciders: address,
            withModeration: false,
            args: ['1', '8', '1']
          }
        ]
      })
      expect(organigram).not.toBeNull()
    })

    it('should predict deterministic addresses', async () => {
      const salt = createRandom32BytesHexId()
      const salt2 = createRandom32BytesHexId()
      const salt3 = createRandom32BytesHexId()
      const salt4 = createRandom32BytesHexId()
      const salt5 = createRandom32BytesHexId()
      const salt6 = createRandom32BytesHexId()

      const predictedAddress = predictContractAddress({
        type: 'Organ',
        chainId: '11155111',
        salt
      })
      const predictedAddress2 = predictContractAddress({
        type: 'Organ',
        chainId: '11155111',
        salt: salt2
      })
      const predictedAddress3 = predictContractAddress({
        type: 'NominationProcedure',
        chainId: '11155111',
        salt: salt3
      })
      const predictedAddress4 = predictContractAddress({
        type: 'ERC20VoteProcedure',
        chainId: '11155111',
        salt: salt4
      })
      const predictedAddress5 = predictContractAddress({
        type: 'VoteProcedure',
        chainId: '11155111',
        salt: salt5
      })
      const predictedAddress6 = predictContractAddress({
        type: 'Asset',
        chainId: '11155111',
        salt: salt6
      })
      const organigram = {
        organs: [
          {
            cid: '',
            permissions: [],
            salt
          },
          {
            cid: '',
            permissions: [],
            salt: salt2
          }
        ],
        procedures: [
          {
            typeName: 'nomination' as const,
            proposers: predictedAddress,
            moderators: predictedAddress,
            deciders: predictedAddress,
            withModeration: false,
            forwarder: deployedAddresses['11155111'].MetaGasStation,
            salt: salt3
          },
          {
            typeName: 'erc20Vote' as const,
            proposers: predictedAddress,
            moderators: predictedAddress,
            deciders: predictedAddress,
            withModeration: false,
            forwarder: deployedAddresses['11155111'].MetaGasStation,
            salt: salt4,
            args: [ERC20_EXAMPLE, '1', '8', '1']
          },
          {
            typeName: 'vote' as const,
            proposers: predictedAddress,
            moderators: predictedAddress,
            deciders: predictedAddress,
            withModeration: false,
            forwarder: deployedAddresses['11155111'].MetaGasStation,
            salt: salt5,
            args: ['1', '8', '1']
          }
        ],
        assets: [
          {
            name: 'ERC20_2',
            symbol: 'ERC',
            salt: salt6
          }
        ]
      }
      const deployed = (await organigramClient.deployOrganigram(
        organigram
      )) as unknown as string[][][]
      const [organs, assets, procedures] = deployed

      expect(organs[0]).toBe(predictedAddress)
      expect(organs[1]).toBe(predictedAddress2)
      expect(procedures[0]).toBe(predictedAddress3)
      expect(procedures[1]).toBe(predictedAddress4)
      expect(procedures[2]).toBe(predictedAddress5)
      expect(assets[0]).toBe(predictedAddress6)
    })

    describe('Nomination', () => {
      let procedure: NominationProcedure
      let proposalKey: string

      it('should create a nomination procedure', async () => {
        const address = signerAddress

        procedure = (await organigramClient.deployProcedure({
          typeName: 'nomination',
          deciders: address
        })) as NominationProcedure

        expect(procedure?.address).not.toBeNull()
      })

      it('should add procedure to an organ', async () => {
        const receipt = await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: PERMISSIONS.ADMIN
        })
        organ = await organ.reload()
        expect(receipt.status).toBe('success')
        expect(
          organ.permissions.some(
            p =>
              p.permissionAddress === procedure.address &&
              p.permissionValue === PERMISSIONS.ADMIN
          )
        ).toBe(true)
      })

      it('should create a proposal', async () => {
        organ = await organ.reload()
        const randomWallet = privateKeyToAccount(generatePrivateKey())
        const data = await Organ.populateTransaction(
          organ.address,
          walletClient as any,
          'addEntries',
          [{ address: randomWallet.address, cid: '' }]
        )
        const operation: ProcedureProposalOperation = {
          index: '0',
          target: data.to,
          data: data.data as string,
          value: '0',
          processed: false,
          functionSelector: data.data?.substring(0, 10) as string
        }
        const proposal = await procedure.propose({
          cid: '',
          operations: [operation]
        })
        proposalKey = proposal?.key

        expect(proposal?.key).not.toBeNull()
      })

      it('should reload a procedure with its proposals', async () => {
        const reloadedProcedure = await NominationProcedure.load(
          procedure.address,
          clients,
          {
            typeName: 'nomination',
            deciders: procedure.deciders,
            proposers: procedure.proposers,
            moderators: procedure.moderators
          }
        )

        expect(reloadedProcedure.proposals.length).toBe(1)
        expect(reloadedProcedure.proposals[0]?.presented).toBe(true)
      })

      it('should approve a proposal', async () => {
        const nominated = await procedure.nominate(proposalKey)
        expect(nominated).toBe(true)
      })

      it('should reload an organ with newly approved entries', async () => {
        organ = await organ.reload()
        expect(organ.entries.length).toBe(1)
      })

      it('should block a proposal', async () => {
        // Creating a new proposal
        const randomWallet = privateKeyToAccount(generatePrivateKey())
        const data = await Organ.populateTransaction(
          organ.address,
          walletClient as any,
          'addEntries',
          [{ address: randomWallet.address, cid: '' }]
        )
        const operation: ProcedureProposalOperation = {
          index: '0',
          target: data.to,
          data: data.data as string,
          value: '0',
          processed: false,
          functionSelector: data.data?.substring(0, 10) as string
        }
        const proposal = await procedure.propose({
          cid: '',
          operations: [operation]
        })

        // Blocking the proposal
        const receipt = await procedure.blockProposal(proposal.key, '')
        // Checking with updated procedure.
        const payload = await NominationProcedure.loadProposal(
          procedure.address,
          proposal.key,
          clients
        )
        expect(receipt.status).toBe('success')
        expect(payload.blocked).toBe(true)
      })
    })

    describe('Vote', () => {
      let procedure: VoteProcedure
      let proposalKey: string

      it('should create a vote procedure', async () => {
        const address = signerAddress
        procedure = (await organigramClient.deployProcedure({
          typeName: 'vote',
          options: {},
          cid: '',
          proposers: address,
          moderators: address,
          deciders: address,
          withModeration: false,
          forwarder: deployedAddresses['11155111'].MetaGasStation,
          salt: createRandom32BytesHexId(),
          args: ['1', '1', '8']
        })) as unknown as VoteProcedure

        expect(procedure?.address).not.toBeNull()
      })

      it('should add permission to an organ', async () => {
        return await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: parseInt('0xffff', 16)
        })
      })

      it('should create a proposal', async () => {
        const randomWallet = privateKeyToAccount(generatePrivateKey())
        const data = await Organ.populateTransaction(
          organ.address,
          walletClient as any,
          'addEntries',
          [{ address: randomWallet.address, cid: '' }]
        )
        const operation: ProcedureProposalOperation = {
          index: '0',
          target: data.to,
          data: data.data as string,
          value: '0',
          processed: false,
          functionSelector: data.data?.substring(0, 10) as string
        }
        const proposal = await procedure.propose({
          cid: '',
          operations: [operation]
        })
        proposalKey = proposal?.key

        expect(proposalKey).not.toBeNull()
      })

      it('should block a proposal', async () => {
        const receipt = await procedure.blockProposal(proposalKey, '')
        // Checking with updated procedure.
        const payload = await VoteProcedure.loadProposal(
          procedure.address,
          proposalKey,
          clients
        )
        expect(receipt.status).toBe('success')
        expect(payload.blocked).toBe(true)
      })
    })

    describe('ERC20 Vote', () => {
      let procedure: ERC20VoteProcedure
      let proposalKey: string

      it('should create an erc20Vote procedure', async () => {
        const address = signerAddress
        procedure = (await organigramClient.deployProcedure({
          typeName: 'erc20Vote',
          options: {},
          cid: '',
          proposers: address,
          moderators: address,
          deciders: address,
          withModeration: false,
          forwarder: deployedAddresses['11155111'].MetaGasStation,
          salt: createRandom32BytesHexId(),
          args: [ERC20_EXAMPLE, '1', '1', '8']
        })) as ERC20VoteProcedure

        expect(procedure?.address).not.toBeNull()
      })

      it('should add procedure to an organ', async () => {
        const receipt = await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: parseInt('0xffff', 16)
        })
        organ = await organ.reload()
        expect(receipt.status).toBe('success')
        expect(
          organ.permissions.some(
            p =>
              p.permissionAddress === procedure.address &&
              p.permissionValue === 65535
          )
        ).toBe(true)
      })

      it('should create a proposal', async () => {
        const randomWallet = privateKeyToAccount(generatePrivateKey())
        const data = await Organ.populateTransaction(
          organ.address,
          walletClient as any,
          'addEntries',
          [{ address: randomWallet.address, cid: '' }]
        )
        const operation: ProcedureProposalOperation = {
          index: '0',
          target: data.to,
          data: data.data as string,
          value: '0',
          processed: false,
          functionSelector: data.data?.substring(0, 10) as string
        }
        const proposal = await procedure.propose({
          cid: '',
          operations: [operation]
        })
        proposalKey = proposal?.key

        expect(proposalKey).not.toBeNull()
      })

      it('should block a proposal', async () => {
        const receipt = await procedure.blockProposal(proposalKey, '')
        // Checking with updated procedure.
        const payload = await ERC20VoteProcedure.loadProposal(
          procedure.address,
          proposalKey,
          clients
        )
        expect(receipt.status).toBe('success')
        expect(payload.blocked).toBe(true)
      })
    })
  })
})
