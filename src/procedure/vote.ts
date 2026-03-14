import { ethers } from 'ethers'
import {
  Procedure,
  type ProcedureProposal,
  type Election,
  ProcedureInput,
  ProcedureJson
} from '../procedure'
import VoteProcedureContractABI from '@organigram/protocol/artifacts/contracts/procedures/Vote.sol/VoteProcedure.json'
import { type TransactionOptions } from '../organigramClient'
import { deployedAddresses, handleJsonBigInt } from '../utils'
import { tryMulticall } from '../multicall'
import { PopulateInitializeInput, ProcedureTypeName, vote } from './utils'

export type VoteProcedureInput = ProcedureInput & {
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]
}
export class VoteProcedure extends Procedure {
  static INTERFACE = '0xc9d27afe' // vote() signature.
  contract: ethers.Contract
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]
  typeName: ProcedureTypeName = 'vote'
  type = vote

  // Constructor needs to call Procedure constructor.
  constructor({
    quorumSize,
    voteDuration,
    majoritySize,
    elections,
    ...procedureInput
  }: VoteProcedureInput) {
    super({
      ...procedureInput,
      typeName: 'vote',
      type: vote
    })
    this.quorumSize = quorumSize
    this.voteDuration = voteDuration
    this.majoritySize = majoritySize
    this.elections = elections
    this.contract = new ethers.Contract(
      this.address,
      VoteProcedureContractABI.abi,
      procedureInput.signerOrProvider
    )
  }

  // _populateInitialize() overrides Procedure _populateInitialize.
  // @ts-ignore
  static async _populateInitialize(
    input: PopulateInitializeInput
  ): Promise<ethers.ContractTransaction> {
    if (input.options?.signer == null) {
      throw new Error('Not connected.')
    }
    const [quorumSize, voteDuration, majoritySize] = input.args as string[]
    if (!quorumSize || !voteDuration || !majoritySize) {
      throw new Error(
        'Missing some required election parameters. Received:' +
          input.args.join(',')
      )
    }
    const contract = new ethers.Contract(
      vote.address,
      VoteProcedureContractABI.abi,
      input.options.signer
    )

    const chainId = await input.options.signer.provider
      ?.getNetwork()
      .then(n => n.chainId.toString())
    const args = [
      input.cid ?? 'vote',
      input.proposers,
      input.moderators ?? ethers.ZeroAddress,
      input.deciders,
      input.withModeration ?? false,
      input.forwarder ??
        deployedAddresses[(chainId ?? '11155111') as '11155111'].MetaGasStation,
      parseInt(quorumSize, 16),
      parseInt(voteDuration, 16),
      parseInt(majoritySize, 16),
      input.options
    ]
    return await contract.initialize.populateTransaction(...args)
  }

  static async loadElection(
    address: string,
    proposalKey: string,
    signer: ethers.Signer,
    voteDuration?: bigint,
    contract?: ethers.Contract
  ): Promise<Election> {
    const procedureContract =
      contract ??
      new ethers.Contract(
        address,
        VoteProcedureContractABI.abi,
        signer
      )
    const election = await procedureContract.getElection(proposalKey)
    if (!election.start) throw new Error('Election not found.')
    const currentVoteDuration =
      voteDuration ?? (await procedureContract.voteDuration())
    const hasEnded =
      Number(currentVoteDuration) + parseInt(election.start) < Date.now() / 1000
    let approved
    try {
      approved = hasEnded
        ? election.votesCount !== BigInt(0)
          ? await procedureContract.count(proposalKey)
          : false
        : false
    } catch (error) {
      console.warn('Error while counting votes.', address, proposalKey, error)
      approved = false
    }
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
    signerOrProvider: ethers.Signer | ethers.Provider,
    proposalsLength?: number
  ): Promise<Election[]> {
    const totalProposals =
      proposalsLength ??
      Number(
        (await Procedure.loadData(address, signerOrProvider)).proposalsLength
      )
    const contract = new ethers.Contract(
      address,
      VoteProcedureContractABI.abi,
      signerOrProvider
    )
    const voteDuration = await contract.voteDuration()
    const contractInterface = new ethers.Interface(VoteProcedureContractABI.abi)
    const multicallElections = await tryMulticall(
      signerOrProvider,
      Array.from({ length: totalProposals }).map((_, i) => ({
        target: address,
        callData: contractInterface.encodeFunctionData('getElection', [
          i.toString()
        ]),
        decode: returnData => {
          const [election] = contractInterface.decodeFunctionResult(
            'getElection',
            returnData
          )
          return {
            key: i.toString(),
            start: election.start,
            votesCount: election.votesCount,
            hasVoted: election.hasVoted
          }
        }
      }))
    )

    if (multicallElections != null) {
      const electionsToCount = multicallElections.filter(
        election =>
          election != null &&
          election.start != null &&
          election.start !== BigInt(0) &&
          Number(voteDuration ?? 0n) + Number(election.start) <
            Date.now() / 1000 &&
          election.votesCount !== BigInt(0)
      )
      const countedResults =
        electionsToCount.length > 0
          ? await tryMulticall(
              signerOrProvider,
              electionsToCount.map(election => ({
                target: address,
                callData: contractInterface.encodeFunctionData('count', [
                  election!.key
                ]),
                decode: returnData =>
                  contractInterface.decodeFunctionResult('count', returnData)[0]
              }))
            )
          : []
      const countedApprovals = new Map<string, boolean>()
      electionsToCount.forEach((election, index) => {
        countedApprovals.set(
          election!.key,
          countedResults?.[index] != null ? Boolean(countedResults[index]) : false
        )
      })

      return multicallElections
        .filter(
          (
            election
          ): election is {
            key: string
            start: bigint
            votesCount: bigint
            hasVoted: boolean
          } => election != null && election.start != null && election.start !== BigInt(0)
        )
        .map(election => ({
          proposalKey: election!.key,
          start: election!.start.toString(),
          votesCount: election!.votesCount.toString(),
          hasVoted: election!.hasVoted,
          approved: countedApprovals.get(election!.key) ?? false
        }))
    }

    return (
      await Promise.all(
        Array.from({ length: totalProposals }).map(async (_, i) => {
          const key = i.toString()
          return await VoteProcedure.loadElection(
            address,
            key,
            signerOrProvider as ethers.Signer,
            voteDuration,
            contract
          ).catch((error: Error) => {
            console.warn(
              'Error while loading election in vote procedure.',
              address,
              key,
              error.message
            )
            return null
          })
        })
      )
    ).filter((election): election is Election => election != null)
  }

  static async load(
    address: string,
    signerOrProvider: ethers.Signer | ethers.Provider,
    initialProcedure?: ProcedureInput
  ): Promise<VoteProcedure> {
    const procedure = await Procedure.load(
      address,
      signerOrProvider,
      initialProcedure
    )
    if (!procedure) throw new Error('Not a valid procedure.')
    const contract = new ethers.Contract(
      address,
      VoteProcedureContractABI.abi,
      signerOrProvider
    )
    const quorumSize = await contract.quorumSize()
    const voteDuration = await contract.voteDuration()
    const majoritySize = await contract.majoritySize()
    const elections = await VoteProcedure.loadElections(
      address,
      signerOrProvider as ethers.Signer,
      procedure.proposals.length
    )
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

    return new VoteProcedure({
      ...initialProcedure,
      cid: procedure.cid,
      address: procedure.address,
      chainId: procedure.chainId,
      signerOrProvider: signerOrProvider as ethers.Signer,
      metadata: procedure.metadata,
      proposers: procedure.proposers,
      moderators: procedure.moderators,
      deciders: procedure.deciders,
      withModeration: procedure.withModeration,
      forwarder: procedure.forwarder,
      proposals,
      quorumSize: quorumSize?.toString(),
      voteDuration: voteDuration?.toString(),
      majoritySize: majoritySize?.toString(),
      elections,
      typeName: 'vote',
      type: vote
    })
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
        throw error
      })
    if (options?.onTransaction != null) {
      options.onTransaction(tx, 'Initialize Nomination procedure.')
    }
    return await tx.wait()
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

  toJson = (): ProcedureJson =>
    JSON.parse(
      JSON.stringify(
        {
          address: this.address,
          chainId: this.chainId!,
          salt: this.salt,
          data: this.data,
          typeName: this.typeName,
          name: this.name,
          description: this.description,
          organigramId: this.organigramId,
          cid: this.cid,
          isDeployed: this.isDeployed,
          deciders: this.deciders,
          proposers: this.proposers,
          moderators: this.moderators ?? ethers.ZeroAddress,
          withModeration: this.withModeration,
          forwarder: this.forwarder,
          metadata: this.metadata,
          proposals: this.proposals,
          type: this.type,
          quorumSize: this.quorumSize,
          voteDuration: this.voteDuration,
          majoritySize: this.majoritySize,
          elections: this.elections
        },
        handleJsonBigInt
      )
    )
}
