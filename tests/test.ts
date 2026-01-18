import { strictEqual } from 'assert'
import { ethers } from 'ethers'
import { Organigram, type Organ, type ProcedureProposalOperation } from '../src'
// import { CID } from 'multiformats/cid'
import NominationProcedure from '@organigram/procedures/src/nomination/class'
import VoteProcedure from '@organigram/procedures/src/vote/class'
import ERC20VoteProcedure from '@organigram/procedures/src/erc20Vote/class'
import { type TransactionOptions } from '../types/types'

const ETHEREUM_PROVIDER = process.env.ETHEREUM_PROVIDER as string
const ORGANIGRAM = process.env.NEXT_PUBLIC_GANACHE_MANAGER as string
const ERC20_EXAMPLE = process.env.ERC20_EXAMPLE as string
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

describe('Organigram', () => {
  let provider: ethers.providers.JsonRpcProvider
  let signer: ethers.Signer
  // let ipfs: IPFS.IPFS
  let organ: Organ

  beforeEach(async () => {
    // ipfs = await loadIpfs()
    provider = new ethers.providers.JsonRpcProvider(ETHEREUM_PROVIDER)
    signer = provider.getSigner(0)
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

      strictEqual(network.chainId, 1337)
      strictEqual(network.name, 'unknown')
    })

    it('should provide signer with funds', async () => {
      const chainId = await signer.getChainId()
      const address = await signer.getAddress()
      const balance = await signer.getBalance()

      strictEqual(chainId, 1337)
      strictEqual(address != null && address !== '', true)
      strictEqual(balance.gt(0), true)
    })
  })

  describe('Protocol', () => {
    let organigram: Organigram

    beforeEach(async () => {
      organigram = await Organigram.load(ORGANIGRAM, provider, signer)
    })

    it('should connect to the deployed protocol', async () => {
      strictEqual(organigram?.address != null, true)
    })

    it('should create an organ', async () => {
      organ = await organigram.createOrgan(
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
        procedure = (await organigram.createProcedure(
          organigram.procedureTypes[0].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
          process.env.NEXT_PUBLIC_GOERLI_GAS_STATION_FORWARDER as string
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
        const data = await organ.contract.populateTransaction.addEntries([
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
        const data = await organ.contract.populateTransaction.addEntries([
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
        procedure = (await organigram.createProcedure(
          organigram.procedureTypes[1].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
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
        const data = await organ.contract.populateTransaction.addEntries([
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
        const data = await organ.contract.populateTransaction.addEntries([
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
        procedure = (await organigram.createProcedure(
          organigram.procedureTypes[2].address,
          txOptions,
          '',
          address,
          address,
          address,
          false,
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
        const data = await organ.contract.populateTransaction.addEntries([
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
        const data = await organ.contract.populateTransaction.addEntries([
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
