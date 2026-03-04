import { strictEqual } from 'assert'
import deployedAddresses from '@organigram/protocol/deployments.json'
import AssetContractABI from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json'
import { ethers, isAddress, JsonRpcProvider, Signer } from 'ethers'

import {
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
  let provider: JsonRpcProvider
  let signer: Signer
  // let ipfs: IPFS.IPFS
  let organ: Organ
  let asset: string

  beforeEach(async () => {
    // ipfs = await loadIpfs()
    provider = new JsonRpcProvider('http://127.0.0.1:8545/')
    signer = await provider.getSigner(0)
    await Promise.resolve()
  })

  describe('Web3', () => {
    it('should connect Web3 to a provider', async () => {
      const network = await provider.getNetwork()

      strictEqual(network.chainId, 11155111n)
      strictEqual(network.name, 'sepolia')
    })

    it('should provide signer with funds', async () => {
      const chainId = (await signer.provider?.getNetwork())?.chainId
      const address = await signer.getAddress()
      const balance = await signer.provider?.getBalance(address)

      strictEqual(chainId, 11155111n)
      strictEqual(address != null && address !== '', true)
      strictEqual(balance != null && balance > 0n, true)
    })
  })

  describe('Protocol', () => {
    let organigramClient: OrganigramClient

    beforeEach(async () => {
      organigramClient = await OrganigramClient.load({
        provider,
        signer
      })
    })

    it('should connect to the deployed client', async () => {
      strictEqual(organigramClient?.address != null, true)
    })

    it('should create an organ', async () => {
      organ = await organigramClient.deployOrgan()
      strictEqual(organ?.address != null, true)
    })

    it('should create organs in batch', async () => {
      const organs = await organigramClient.deployOrgans([{}, {}])
      strictEqual(organs?.length === 2, true)
    })

    it('should deploy an ERC20 asset', async () => {
      asset = await organigramClient.deployAsset(
        'ERC20',
        'ERC',
        ERC20_INITIAL_SUPPLY,
        undefined,
        txOptions
      )
      strictEqual(isAddress(asset), true)
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
      strictEqual(assets?.length === 2, true)
      strictEqual(isAddress(assets[0]), true)
    })

    it('should deposit ether into an organ', async () => {
      const amount = ethers.parseEther('0.01')

      await (
        await signer.sendTransaction({ to: organ.address, value: amount })
      ).wait()

      strictEqual(await provider.getBalance(organ.address), amount)
    })

    it('should withdraw ether from an organ', async () => {
      const amount = ethers.parseEther('0.01')
      const recipientAddress = ethers.Wallet.createRandom().address
      const receipt = await organ.withdrawEther(
        recipientAddress,
        amount,
        txOptions
      )

      strictEqual(
        await provider.getBalance(organ.address, receipt!.blockNumber),
        0n
      )
      strictEqual(
        await provider.getBalance(recipientAddress, receipt!.blockNumber),
        amount
      )
    })

    it('should withdraw ERC20 tokens from an organ', async () => {
      const recipientAddress = ethers.Wallet.createRandom().address
      const amount = ethers.parseEther('15')
      const assetContract = new ethers.Contract(
        asset,
        AssetContractABI.abi,
        signer
      )

      await (await assetContract.transfer(organ.address, amount)).wait()

      strictEqual(await assetContract.balanceOf(organ.address), amount)

      await organ.withdrawERC20(asset, recipientAddress, amount, txOptions)

      strictEqual(await assetContract.balanceOf(organ.address), 0n)
      strictEqual(await assetContract.balanceOf(recipientAddress), amount)
    })

    it('should deploy procedures in batch', async () => {
      const address = await signer.getAddress()
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
      strictEqual(procedures?.length === 2, true)
    })

    it('should deploy test organigram', async () => {
      const address = await signer.getAddress()
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
      strictEqual(organigram != null, true)
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

      strictEqual(organs[0], predictedAddress)
      strictEqual(organs[1], predictedAddress2)
      strictEqual(procedures[0], predictedAddress3)
      strictEqual(procedures[1], predictedAddress4)
      strictEqual(procedures[2], predictedAddress5)
      strictEqual(assets[0], predictedAddress6)
    })

    describe('Nomination', () => {
      let procedure: NominationProcedure
      let proposalKey: string

      it('should create a nomination procedure', async () => {
        const address = await signer.getAddress()

        procedure = (await organigramClient.deployProcedure({
          typeName: 'nomination',
          deciders: address
        })) as NominationProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
        const receipt = await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: PERMISSIONS.ADMIN
        })
        organ = await organ.reload()
        strictEqual(receipt.status, 1)
        strictEqual(
          organ.permissions.some(
            p =>
              p.permissionAddress === procedure.address &&
              p.permissionValue === PERMISSIONS.ADMIN
          ),
          true
        )
      })

      it('should create a proposal', async () => {
        organ = await organ.reload()
        const randomWallet = ethers.Wallet.createRandom()
        const data = await organ.contract.addEntries.populateTransaction([
          {
            addr: randomWallet.address,
            cid: ''
          }
        ])
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

        strictEqual(proposal?.key != null, true)
      })

      it('should approve a proposal', async () => {
        const nominated = await procedure.nominate(proposalKey)
        strictEqual(nominated, true)
      })

      it('should block a proposal', async () => {
        // Creating a new proposal
        const randomWallet = ethers.Wallet.createRandom()
        const data = await organ.contract.addEntries.populateTransaction([
          {
            addr: randomWallet.address,
            cid: ''
          }
        ])
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
          signer
        )
        strictEqual(receipt.status, 1)
        strictEqual(payload.blocked, true)
      })
    })

    describe('Vote', () => {
      let procedure: VoteProcedure
      let proposalKey: string

      it('should create a vote procedure', async () => {
        const address = await signer.getAddress()
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

        strictEqual(procedure?.address != null, true)
      })

      it('should add permission to an organ', async () => {
        return await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: parseInt('0xffff', 16)
        })
      })

      it('should create a proposal', async () => {
        const randomWallet = ethers.Wallet.createRandom()
        const data = await organ.contract.addEntries.populateTransaction([
          {
            addr: randomWallet.address,
            cid: ''
          }
        ])
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

        strictEqual(proposalKey != null, true)
      })

      it('should block a proposal', async () => {
        const receipt = await procedure.blockProposal(proposalKey, '')
        // Checking with updated procedure.
        const payload = await VoteProcedure.loadProposal(
          procedure.address,
          proposalKey,
          signer
        )
        strictEqual(receipt.status, 1)
        strictEqual(payload.blocked, true)
      })
    })

    describe('ERC20 Vote', () => {
      let procedure: ERC20VoteProcedure
      let proposalKey: string

      it('should create an erc20Vote procedure', async () => {
        const address = await signer.getAddress()
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

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
        const receipt = await organ.addPermission({
          permissionAddress: procedure.address,
          permissionValue: parseInt('0xffff', 16)
        })
        organ = await organ.reload()
        strictEqual(receipt.status, 1)
        strictEqual(
          organ.permissions.some(
            p =>
              p.permissionAddress === procedure.address &&
              p.permissionValue === 65535
          ),
          true
        )
      })

      it('should create a proposal', async () => {
        const randomWallet = ethers.Wallet.createRandom()
        const data = await organ.contract.addEntries.populateTransaction([
          {
            addr: randomWallet.address,
            cid: ''
          }
        ])
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

        strictEqual(proposalKey != null, true)
      })

      it('should block a proposal', async () => {
        const receipt = await procedure.blockProposal(proposalKey, '')
        // Checking with updated procedure.
        const payload = await ERC20VoteProcedure.loadProposal(
          procedure.address,
          proposalKey,
          signer
        )
        strictEqual(receipt.status, 1)
        strictEqual(payload.blocked, true)
      })
    })
  })
})
