import { ethers } from 'ethers'
import Procedure, { type ProcedureProposal } from '.'
import ERC20VoteProcedureContractABI from '@organigram/protocol/abi/ERC20VoteProcedure.json'
import { Election, TransactionOptions } from '../types'

export default class ERC20VoteProcedure extends Procedure {
  static INTERFACE = '0xc9d27afe' // vote() signature.
  erc20: string
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]
  contract: ethers.Contract

  // Constructor needs to call Procedure constructor.
  constructor(
    cid: string,
    address: string,
    chainId: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    metadata: unknown,
    proposers: string,
    moderators: string,
    deciders: string,
    withModeration: boolean,
    forwarder: string,
    proposals: ProcedureProposal[],
    erc20: string,
    quorumSize: string,
    voteDuration: string,
    majoritySize: string,
    elections: Election[]
  ) {
    super(
      cid,
      address,
      chainId,
      signerOrProvider,
      metadata,
      proposers,
      moderators,
      deciders,
      withModeration,
      forwarder,
      proposals
    )
    this.erc20 = erc20
    this.quorumSize = quorumSize
    this.voteDuration = voteDuration
    this.majoritySize = majoritySize
    this.elections = elections
    this.contract = new ethers.Contract(
      address,
      ERC20VoteProcedureContractABI,
      signerOrProvider
    )
  }

  // _populateInitialize() overrides Procedure _populateInitialize.
  static async _populateInitialize(
    type: string,
    options: { signer: ethers.Signer } & TransactionOptions,
    cid: string,
    proposers: string,
    moderators: string,
    deciders: string,
    withModeration: boolean,
    forwarder: string,
    erc20: string,
    quorumSize: string,
    voteDuration: string,
    majoritySize: string
  ): Promise<ethers.ContractTransaction> {
    if (options.signer == null) {
      throw new Error('Not connected.')
    }
    const contract = new ethers.Contract(
      type,
      ERC20VoteProcedureContractABI,
      options.signer
    )
    return await contract.initialize.populateTransaction(
      cid,
      proposers,
      moderators,
      deciders,
      withModeration,
      forwarder,
      erc20,
      quorumSize,
      voteDuration,
      majoritySize
    )
  }

  static async loadElection(
    address: string,
    proposalKey: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<Election> {
    const contract = new ethers.Contract(
      address,
      ERC20VoteProcedureContractABI,
      signerOrProvider
    )
    const election = await contract.getElection(proposalKey)
    if (!election.start) throw new Error('Election not found.')
    const voteDuration = await contract.voteDuration()
    const approved =
      parseInt(voteDuration) + parseInt(election.start) < Date.now() / 1000
        ? await contract.count(proposalKey).catch((error: Error) => {
            console.warn(
              'Error while counting votes.',
              address,
              proposalKey,
              error.message
            )
            return false
          })
        : false
    return {
      proposalKey,
      start: election.start.toString(),
      votesCount: election.votesCount.toString(),
      hasVoted: election.hasVoted,
      approved
    }
  }

  static async loadElections(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<Election[]> {
    const data = await Procedure.loadData(address, signerOrProvider)
    const proposalsLength = BigInt(data.proposalsLength)
    const elections: Election[] = []
    for (let i = 0; i < proposalsLength; i++) {
      const key: string = i.toString()
      const election: Election | null = await ERC20VoteProcedure.loadElection(
        address,
        key,
        signerOrProvider
      ).catch((error: Error) => {
        console.warn(
          'Error while loading election in ERC20 vote procedure.',
          address,
          key,
          error.message
        )
        return null
      })
      if (election) elections.push(election)
    }
    return elections
  }

  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider
  ): Promise<ERC20VoteProcedure> {
    const procedure = await Procedure.load(address, signerOrProvider)
    if (!procedure) throw new Error('Not a valid procedure.')
    const contract = new ethers.Contract(
      address,
      ERC20VoteProcedureContractABI,
      signerOrProvider
    )
    const erc20 = await contract.tokenContract()
    const quorumSize = await contract.quorumSize()
    const voteDuration = await contract.voteDuration()
    const majoritySize = await contract.majoritySize()
    const elections = await ERC20VoteProcedure.loadElections(
      address,
      signerOrProvider
    )
    // Make sure expired proposals are listed as blocked.
    const proposals = procedure.proposals.map(proposal => {
      if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
        const election = elections.find(ba => ba.proposalKey === proposal.key)
        if (election?.start) {
          // Proposal is blocked if election is expired and not approved.
          // @todo User BigNumber
          proposal.blocked =
            !election.approved &&
            parseInt(election.start) + parseInt(voteDuration) <=
              Date.now() / 1000
        }
      }
      return proposal
    })
    return new ERC20VoteProcedure(
      procedure.cid,
      procedure.address,
      procedure.chainId,
      signerOrProvider,
      procedure.metadata,
      procedure.proposers,
      procedure.moderators,
      procedure.deciders,
      procedure.withModeration,
      procedure.forwarder,
      proposals,
      erc20.toString(),
      quorumSize.toString(),
      voteDuration.toString(),
      majoritySize.toString(),
      elections
    )
  }

  async erc20Balance(account?: string): Promise<bigint> {
    const erc20 = await this.contract.tokenContract()
    const ERC20_ABI = [
      // balanceOf
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function'
      },
      // decimals
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        type: 'function'
      }
    ]
    const signerOrProvider = this.signer ?? this.provider
    if (signerOrProvider == null) {
      throw new Error('Not connected.')
    }
    const erc20Contract = new ethers.Contract(
      erc20,
      ERC20_ABI,
      signerOrProvider
    )
    if (this.signer == null && account == null) {
      return BigInt(0)
    }
    return await erc20Contract.balanceOf(
      account ?? (await this.signer?.getAddress())
    )
  }

  async vote(
    proposalKey: string,
    approval: boolean,
    options: TransactionOptions
  ): Promise<boolean> {
    const tx = await this.contract
      .vote(proposalKey, approval)
      .catch((error: Error) => {
        console.error(
          'Error while voting.',
          this.address,
          proposalKey,
          error.message
        )
        return false
      })
    if (options?.onTransaction != null) {
      options.onTransaction(tx, 'Initialize ERC20 Vote procedure.')
    }
    return tx.wait()
  }

  async count(proposalKey: string): Promise<boolean> {
    return this.contract.count(proposalKey).catch((error: Error) => {
      console.error(
        'Error while voting.',
        this.address,
        proposalKey,
        error.message
      )
      return false
    })
  }
}
