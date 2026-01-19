import { ethers } from 'ethers'
import { Procedure, type ProcedureProposal, type Election } from '../procedure'
import VoteProcedureContractABI from '@organigram/protocol/abi/VoteProcedure.json'
import { type TransactionOptions } from '../organigramClient'

export class VoteProcedure extends Procedure {
  static INTERFACE = '0xc9d27afe' // vote() signature.
  contract: ethers.Contract
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]

  // Constructor needs to call Procedure constructor.
  constructor(
    cid: string,
    address: string,
    chainId: string,
    signer: ethers.Signer,
    metadata: unknown,
    proposers: string,
    moderators: string,
    deciders: string,
    withModeration: boolean,
    forwarder: string,
    proposals: ProcedureProposal[],
    quorumSize: string,
    voteDuration: string,
    majoritySize: string,
    elections: Election[]
  ) {
    super(
      cid,
      address,
      chainId,
      signer,
      metadata,
      proposers,
      moderators,
      deciders,
      withModeration,
      forwarder,
      proposals
    )
    this.quorumSize = quorumSize
    this.voteDuration = voteDuration
    this.majoritySize = majoritySize
    this.elections = elections
    this.contract = new ethers.Contract(
      address,
      VoteProcedureContractABI,
      signer
    )
  }

  // _populateInitialize() overrides Procedure _populateInitialize.
  // @ts-ignore
  static async _populateInitialize(
    type: string,
    options: { signer: ethers.Signer } & TransactionOptions,
    cid: string,
    proposers: string,
    moderators: string,
    deciders: string,
    withModeration: boolean,
    forwarder: string,
    quorumSize: string,
    voteDuration: string,
    majoritySize: string
  ): Promise<ethers.ContractTransaction> {
    if (options.signer == null) {
      throw new Error('Not connected.')
    }
    const contract = new ethers.Contract(
      type,
      VoteProcedureContractABI,
      options.signer
    )
    return await contract.initialize.populateTransaction(
      cid,
      proposers,
      moderators,
      deciders,
      withModeration,
      forwarder,
      quorumSize,
      voteDuration,
      majoritySize
    )
  }

  static async loadElection(
    address: string,
    proposalKey: string,
    signer: ethers.Signer
  ): Promise<Election> {
    const contract = new ethers.Contract(
      address,
      VoteProcedureContractABI,
      signer
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
    signer: ethers.Signer
  ): Promise<Election[]> {
    const data = await Procedure.loadData(address, signer)
    const proposalsLength = BigInt(data.proposalsLength)
    const elections: Election[] = []
    for (let i = 0; i < proposalsLength; i++) {
      const key: string = i.toString()
      const election: Election | null = await VoteProcedure.loadElection(
        address,
        key,
        signer
      ).catch((error: Error) => {
        console.warn(
          'Error while loading election in vote procedure.',
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
    signer: ethers.Signer
  ): Promise<VoteProcedure> {
    const procedure = await Procedure.load(address, signer)
    if (!procedure) throw new Error('Not a valid procedure.')
    const contract = new ethers.Contract(
      address,
      VoteProcedureContractABI,
      signer
    )
    const quorumSize = await contract.quorumSize()
    const voteDuration = await contract.voteDuration()
    const majoritySize = await contract.majoritySize()
    const elections = await VoteProcedure.loadElections(address, signer)
    // Make sure expired proposals are listed as blocked.
    const proposals = procedure.proposals.map((proposal: ProcedureProposal) => {
      if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
        const election = elections.find(ba => ba.proposalKey === proposal.key)
        if (election?.start) {
          // Proposal is blocked if election is expired and not approved.
          proposal.blocked =
            !election.approved &&
            parseInt(election.start) + parseInt(voteDuration) <=
              Date.now() / 1000
        }
      }
      return proposal
    })
    return new VoteProcedure(
      procedure.cid,
      procedure.address,
      procedure.chainId,
      signer,
      procedure.metadata,
      procedure.proposers,
      procedure.moderators,
      procedure.deciders,
      procedure.withModeration,
      procedure.forwarder,
      proposals,
      quorumSize.toString(),
      voteDuration.toString(),
      majoritySize.toString(),
      elections
    )
  }

  async vote(
    proposalKey: string,
    approval: boolean,
    options?: TransactionOptions
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
      options.onTransaction(tx, 'Initialize Nomination procedure.')
    }
    return tx.wait()
  }

  async count(proposalKey: string): Promise<boolean> {
    return this.contract.count(proposalKey).catch((error: Error) => {
      console.error(
        'Error while counting.',
        this.address,
        proposalKey,
        error.message
      )
      return false
    })
  }
}
