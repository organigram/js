import { strictEqual } from 'assert'
import deployedAddresses from '@organigram/protocol/deployments.json'
import { ethers, isAddress, JsonRpcProvider, Signer } from 'ethers'
import {
  ERC20_INITIAL_SUPPLY,
  formatSalt,
  OrganigramClient,
  type Organ,
  type ProcedureProposalOperation
} from '../src'
// import { CID } from 'multiformats/cid'
import { NominationProcedure } from '../src/procedure/nomination'
import { VoteProcedure } from '../src/procedure/vote'
import { ERC20VoteProcedure } from '../src/procedure/erc20Vote'
import { type TransactionOptions } from '../src/organigramClient'

const ETHEREUM_PROVIDER = process.env.ETHEREUM_PROVIDER as string
const ERC20_EXAMPLE = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Sepolia USDC
// const ERC721_EXAMPLE = process.env.ERC721_EXAMPLE
// const ERC1155_EXAMPLE = process.env.ERC1155_EXAMPLE

const txOptions: TransactionOptions = {
  onTransaction: (tx, description) => {
    console.info('New test transaction:', description, 'Hash:', tx.hash)
  }
}

// async function loadIpfs (): Promise<IPFS.IPFS> {
//   const node = await IPFS.create({ silent: true })
//   return node
// }

describe('Organigram JS Client', () => {
  let provider: JsonRpcProvider
  let signer: Signer
  // let ipfs: IPFS.IPFS
  let organ: Organ

  beforeEach(async () => {
    // ipfs = await loadIpfs()
    provider = new JsonRpcProvider(ETHEREUM_PROVIDER)
    signer = await provider.getSigner(0)
    await Promise.resolve()
  })

  // afterEach(async () => {
  //   try {
  //     await ipfs?.stop()
  //   } catch (_err) {}
  // })

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
      organigramClient = await OrganigramClient.load(
        deployedAddresses['11155111'].OrganigramClient,
        provider,
        signer
      )
    })

    it('should connect to the deployed client', async () => {
      strictEqual(organigramClient?.address != null, true)
    })

    it('should create an organ', async () => {
      organ = await organigramClient.createOrgan({
        metadata: '',
        permissions: [],
        options: txOptions
      })
      strictEqual(organ?.address != null, true)
    })

    it('should create organs in batch', async () => {
      const organs = await organigramClient.createOrgans([
        {
          metadata: '',
          permissions: []
        },
        {
          metadata: '',
          permissions: []
        }
      ])
      strictEqual(organs?.length === 2, true)
    })

    it('should deploy an ERC20 asset', async () => {
      const asset = await organigramClient.createAsset(
        'ERC20',
        'ERC',
        ERC20_INITIAL_SUPPLY,
        undefined,
        txOptions
      )
      strictEqual(isAddress(asset), true)
    })

    it('should deploy assets in batch', async () => {
      const assets = await organigramClient.createAssets(
        [
          {
            name: 'ERC20_1',
            symbol: 'ERC',
            initialSupply: ERC20_INITIAL_SUPPLY,
            salt: undefined
          },
          {
            name: 'ERC20_2',
            symbol: 'ERC',
            initialSupply: ERC20_INITIAL_SUPPLY,
            salt: undefined
          }
        ],
        txOptions
      )
      strictEqual(assets?.length === 2, true)
      strictEqual(isAddress(assets[0]), true)
    })

    describe('Nomination', () => {
      let procedure: NominationProcedure
      let proposalKey: string

      it('should create a nomination procedure', async () => {
        const address = await signer.getAddress()

        procedure = (await organigramClient.createProcedure(
          organigramClient.procedureTypes[0].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
          deployedAddresses['11155111'].MetaGasStation,
          formatSalt()
        )) as unknown as NominationProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
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
        const proposal = await procedure.propose('', [operation])
        proposalKey = proposal?.key

        strictEqual(proposal?.key != null, true)
      })

      it('should nominate a proposal', async () => {
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
        const proposal = await procedure.propose('', [operation])

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
        procedure = (await organigramClient.createProcedure(
          organigramClient.procedureTypes[1].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
          deployedAddresses['11155111'].MetaGasStation,
          formatSalt(),
          '1',
          '8',
          '1'
        )) as unknown as VoteProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
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
        const proposal = await procedure.propose('', [operation])
        proposalKey = proposal?.key

        strictEqual(proposalKey != null, true)
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
        const proposal = await procedure.propose('', [operation])

        // Blocking the proposal
        const receipt = await procedure.blockProposal(proposal.key, '')
        // Checking with updated procedure.
        const payload = await VoteProcedure.loadProposal(
          procedure.address,
          proposal.key,
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
        procedure = (await organigramClient.createProcedure(
          organigramClient.procedureTypes[2].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
          deployedAddresses['11155111'].MetaGasStation,
          formatSalt(),
          ERC20_EXAMPLE,
          '1',
          '1',
          '8'
        )) as unknown as ERC20VoteProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
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
        const proposal = await procedure.propose('', [operation])
        proposalKey = proposal?.key

        strictEqual(proposalKey != null, true)
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
        const proposal = await procedure.propose('', [operation])

        // Blocking the proposal
        const receipt = await procedure.blockProposal(proposal.key, '')
        // Checking with updated procedure.
        const payload = await ERC20VoteProcedure.loadProposal(
          procedure.address,
          proposal.key,
          signer
        )
        strictEqual(receipt.status, 1)
        strictEqual(payload.blocked, true)
      })
    })

    it('should create procedures in batch', async () => {
      const address = await signer.getAddress()
      const procedures = await organigramClient.createProcedures([
        {
          type: deployedAddresses['11155111'].NominationProcedure,
          cid: '',
          proposers: address,
          moderators: address,
          deciders: address,
          withModeration: false,
          forwarder: deployedAddresses['11155111'].MetaGasStation
        },
        {
          type: deployedAddresses['11155111'].VoteProcedure,
          cid: '',
          proposers: address,
          moderators: address,
          deciders: address,
          withModeration: false,
          forwarder: deployedAddresses['11155111'].MetaGasStation,
          args: ['1', '8', '1']
        }
      ])
      strictEqual(procedures?.length === 2, true)
    })

    it('should deploy test organigram', async () => {
      const address = await signer.getAddress()
      const organigram = await organigramClient.deployOrganigram({
        organs: [
          {
            metadata: '',
            permissions: []
          },
          {
            metadata: '',
            permissions: []
          }
        ],
        assets: [
          {
            name: 'ERC20_Organigram',
            symbol: 'ERC',
            initialSupply: ERC20_INITIAL_SUPPLY,
            salt: undefined
          }
        ],
        procedures: [
          {
            type: deployedAddresses['11155111'].NominationProcedure,
            cid: '',
            proposers: address,
            moderators: address,
            deciders: address,
            withModeration: false,
            forwarder: deployedAddresses['11155111'].MetaGasStation
          },
          {
            type: deployedAddresses['11155111'].VoteProcedure,
            cid: '',
            proposers: address,
            moderators: address,
            deciders: address,
            withModeration: false,
            forwarder: deployedAddresses['11155111'].MetaGasStation,
            args: ['1', '8', '1']
          }
        ]
      })
      strictEqual(organigram != null, true)
    })
  })
})

// predictContractAddresses()
