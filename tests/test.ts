import { strictEqual } from 'assert'
import deployedAddresses from '@organigram/protocol/ignition/deployments/chain-11155111/deployed_addresses.json'
import { ethers, JsonRpcProvider, Signer } from 'ethers'
import {
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
    console.info('New transaction:', description, 'Hash:', tx.hash)
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
        deployedAddresses['OrganigramClientModule#OrganigramClient'],
        provider,
        signer
      )
    })

    it('should connect to the deployed client', async () => {
      strictEqual(organigramClient?.address != null, true)
    })

    it('should create an organ', async () => {
      organ = await organigramClient.createOrgan(
        '',
        await signer.getAddress(),
        txOptions
      )
      strictEqual(organ?.address != null, true)
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
          process.env.NEXT_PUBLIC_SEPOLIA_GAS_STATION_FORWARDER as string
        )) as unknown as NominationProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
        return await organ.addProcedure({
          address: procedure.address,
          permissions: parseInt('0xffff', 16)
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
          process.env.NEXT_PUBLIC_SEPOLIA_GAS_STATION_FORWARDER as string,
          '1',
          '8',
          '1'
        )) as unknown as VoteProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
        return await organ.addProcedure({
          address: procedure.address,
          permissions: parseInt('0xffff', 16)
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
          process.env.NEXT_PUBLIC_SEPOLIA_GAS_STATION_FORWARDER as string,
          ERC20_EXAMPLE,
          '1',
          '1',
          '8'
        )) as unknown as ERC20VoteProcedure

        strictEqual(procedure?.address != null, true)
      })

      it('should add procedure to an organ', async () => {
        return await organ.addProcedure({
          address: procedure.address,
          permissions: parseInt('0xffff', 16)
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
  })

  // describe('Cleanup', () => {
  //   it('should terminate ipfs', () => {
  //     try {
  //       void ipfs?.stop()
  //     } catch (_err) {}
  //   })
  // })
})
