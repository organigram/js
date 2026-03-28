import VoteProcedureContractABI from '@organigram/protocol/abi/Vote.sol/VoteProcedure.json' with { type: 'json' }
import {
  Procedure,
  type ProcedureProposal,
  type Election,
  type ProcedureInput,
  type ProcedureJson
} from '../procedure'
import { type TransactionOptions } from '../organigramClient'
import { deployedAddresses, handleJsonBigInt } from '../utils'
import { tryMulticall } from '../multicall'
import {
  type PopulateInitializeInput,
  type PopulatedTransactionData,
  ProcedureTypeName,
  vote
} from './utils'
import { decodeFunctionResult, encodeFunctionData, zeroAddress } from 'viem'
import {
  type ContractClients,
  createContractWriteTransaction,
  getContractInstance,
  getWalletAccount
} from '../contracts'

export type VoteProcedureInput = ProcedureInput & {
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]
}

const normalizeElection = (election: any, proposalKey: string): Election => ({
  proposalKey,
  start: (election.start ?? election[0]).toString(),
  votesCount: (election.votesCount ?? election[2]).toString(),
  hasVoted: Boolean(election.hasVoted ?? election[1])
})

export class VoteProcedure extends Procedure {
  static INTERFACE = '0xc9d27afe'

  contract?: any
  quorumSize: string
  voteDuration: string
  majoritySize: string
  elections: Election[]
  typeName: ProcedureTypeName = 'vote'
  type = vote

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
    this.contract =
      this.publicClient != null
        ? getContractInstance({
            address: this.address,
            abi: VoteProcedureContractABI.abi,
            publicClient: this.publicClient,
            walletClient: this.walletClient
          })
        : undefined
  }

  static async _populateInitialize(
    input: PopulateInitializeInput,
    clients: ContractClients
  ): Promise<PopulatedTransactionData> {
    if (clients.walletClient == null) {
      throw new Error('Wallet client not connected.')
    }
    const [quorumSize, voteDuration, majoritySize] = input.args as string[]
    if (!quorumSize || !voteDuration || !majoritySize) {
      throw new Error(
        'Missing some required election parameters. Received:' +
          input.args.join(',')
      )
    }
    const chainId = await clients.publicClient.getChainId()
    return {
      data: encodeFunctionData({
        abi: VoteProcedureContractABI.abi,
        functionName: 'initialize',
        args: [
          input.cid ?? 'vote',
          input.proposers,
          input.moderators ?? zeroAddress,
          input.deciders,
          input.withModeration ?? false,
          input.forwarder ??
            deployedAddresses[(chainId.toString() ?? '11155111') as '11155111']
              .MetaGasStation,
          parseInt(quorumSize, 16),
          parseInt(voteDuration, 16),
          parseInt(majoritySize, 16)
        ]
      })
    }
  }

  static async loadElection(
    address: string,
    proposalKey: string,
    clients: ContractClients,
    voteDuration?: bigint,
    contract?: any
  ): Promise<Election> {
    const procedureContract =
      contract ??
      getContractInstance({
        address,
        abi: VoteProcedureContractABI.abi,
        publicClient: clients.publicClient,
        walletClient: clients.walletClient
      })
    const election = await procedureContract.read.getElection([
      BigInt(proposalKey)
    ])
    const normalizedElection = normalizeElection(election, proposalKey)
    if (!normalizedElection.start || normalizedElection.start === '0') {
      throw new Error('Election not found.')
    }
    const currentVoteDuration =
      voteDuration ?? (await procedureContract.read.voteDuration())
    const hasEnded =
      Number(currentVoteDuration) + parseInt(normalizedElection.start) <
      Date.now() / 1000
    let approved
    try {
      approved = hasEnded
        ? normalizedElection.votesCount !== '0'
          ? await procedureContract.read.count([BigInt(proposalKey)])
          : false
        : false
    } catch (error) {
      console.warn('Error while counting votes.', address, proposalKey, error)
      approved = false
    }
    return {
      ...normalizedElection,
      approved: Boolean(approved)
    }
  }

  static async loadElections(
    address: string,
    clients: ContractClients,
    proposalsLength?: number
  ): Promise<Election[]> {
    const totalProposals =
      proposalsLength ??
      Number((await Procedure.loadData(address, clients)).proposalsLength)
    const contract = getContractInstance({
      address,
      abi: VoteProcedureContractABI.abi,
      publicClient: clients.publicClient,
      walletClient: clients.walletClient
    })
    const voteDuration = (await contract.read.voteDuration()) as bigint
    const multicallElections = await tryMulticall(
      clients,
      Array.from({ length: totalProposals }).map((_, index) => ({
        target: address,
        callData: encodeFunctionData({
          abi: VoteProcedureContractABI.abi,
          functionName: 'getElection',
          args: [BigInt(index)]
        }),
        decode: returnData =>
          normalizeElection(
            decodeFunctionResult({
              abi: VoteProcedureContractABI.abi,
              functionName: 'getElection',
              data: returnData
            }),
            index.toString()
          )
      }))
    )

    if (multicallElections != null) {
      const electionsToCount = multicallElections.filter(
        election =>
          election != null &&
          election.start !== '0' &&
          Number(voteDuration) + Number(election.start) < Date.now() / 1000 &&
          election.votesCount !== '0'
      )
      const countedResults =
        electionsToCount.length > 0
          ? await tryMulticall(
              clients,
              electionsToCount.map(election => ({
                target: address,
                callData: encodeFunctionData({
                  abi: VoteProcedureContractABI.abi,
                  functionName: 'count',
                  args: [BigInt(election!.proposalKey)]
                }),
                decode: returnData =>
                  decodeFunctionResult({
                    abi: VoteProcedureContractABI.abi,
                    functionName: 'count',
                    data: returnData
                  })
              }))
            )
          : []
      const countedApprovals = new Map<string, boolean>()
      electionsToCount.forEach((election, index) => {
        countedApprovals.set(
          election!.proposalKey,
          countedResults?.[index] != null ? Boolean(countedResults[index]) : false
        )
      })

      return multicallElections
        .filter(
          (election): election is Election =>
            election != null && election.start !== '0'
        )
        .map(election => ({
          ...election,
          approved: countedApprovals.get(election.proposalKey) ?? false
        }))
    }

    return (
      await Promise.all(
        Array.from({ length: totalProposals }).map(async (_, index) => {
          const key = index.toString()
          return await VoteProcedure.loadElection(
            address,
            key,
            clients,
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
    clients: ContractClients,
    initialProcedure?: ProcedureInput
  ): Promise<VoteProcedure> {
    const procedure = await Procedure.load(address, clients, initialProcedure)
    const contract = getContractInstance({
      address,
      abi: VoteProcedureContractABI.abi,
      publicClient: clients.publicClient,
      walletClient: clients.walletClient
    })
    const quorumSize = (await contract.read.quorumSize()) as bigint
    const voteDuration = (await contract.read.voteDuration()) as bigint
    const majoritySize = (await contract.read.majoritySize()) as bigint
    const elections = await VoteProcedure.loadElections(
      address,
      clients,
      procedure.proposals.length
    )
    const proposals = procedure.proposals.map((proposal: ProcedureProposal) => {
      if (!proposal.blocked && !proposal.applied && !proposal.adopted) {
        const election = elections.find(candidate => candidate.proposalKey === proposal.key)
        if (election?.start) {
          proposal.blocked =
            !election.approved &&
            parseInt(election.start) + Number(voteDuration) <= Date.now() / 1000
        }
      }
      return proposal
    })

    return new VoteProcedure({
      ...initialProcedure,
      cid: procedure.cid,
      address: procedure.address,
      chainId: procedure.chainId,
      publicClient: clients.publicClient,
      walletClient: clients.walletClient,
      metadata: procedure.metadata,
      proposers: procedure.proposers,
      moderators: procedure.moderators,
      deciders: procedure.deciders,
      withModeration: procedure.withModeration,
      forwarder: procedure.forwarder,
      proposals,
      quorumSize: quorumSize.toString(),
      voteDuration: voteDuration.toString(),
      majoritySize: majoritySize.toString(),
      elections,
      typeName: 'vote',
      type: vote,
      isDeployed: true,
      data:
        initialProcedure?.data ??
        JSON.stringify({
          quorumSize: quorumSize.toString(),
          voteDuration: voteDuration.toString(),
          majoritySize: majoritySize.toString()
        })
    })
  }

  async vote(
    proposalKey: string,
    approval: boolean,
    options?: TransactionOptions
  ): Promise<boolean> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: VoteProcedureContractABI.abi,
      functionName: 'vote',
      args: [BigInt(proposalKey), approval],
      clients: this.getClients(),
      nonce: options?.nonce
    }).catch((error: Error) => {
      console.error('Error while voting.', this.address, proposalKey, error.message)
      throw error
    })
    options?.onTransaction?.(tx, 'Initialize Nomination procedure.')
    const receipt = await tx.wait()
    return receipt.status === 'success'
  }

  async signVote(input: {
    proposalKey: string
    approval: boolean
    nonce: bigint
    deadline: bigint | number
  }): Promise<string> {
    if (this.walletClient == null) {
      throw new Error('Connected wallet cannot sign typed data.')
    }
    const account = await getWalletAccount(this.walletClient)
    return await this.walletClient.signTypedData({
      account,
      domain: this.getTypedDataDomain(),
      primaryType: 'Vote',
      types: {
        Vote: [
          { name: 'proposalKey', type: 'uint256' },
          { name: 'approval', type: 'bool' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      message: {
        proposalKey: BigInt(input.proposalKey),
        approval: input.approval,
        nonce: input.nonce,
        deadline: BigInt(input.deadline)
      }
    })
  }

  async voteBySig(input: {
    proposalKey: string
    approval: boolean
    nonce: bigint
    deadline: bigint | number
    signature: string
  }): Promise<boolean> {
    const tx = await createContractWriteTransaction({
      address: this.address,
      abi: VoteProcedureContractABI.abi,
      functionName: 'voteBySig',
      args: [
        BigInt(input.proposalKey),
        input.approval,
        input.nonce,
        BigInt(input.deadline),
        input.signature
      ],
      clients: this.getClients()
    })
    const receipt = await tx.wait()
    return receipt.status === 'success'
  }

  async count(proposalKey: string): Promise<boolean> {
    const contract =
      this.contract ??
      getContractInstance({
        address: this.address,
        abi: VoteProcedureContractABI.abi,
        ...this.getClients()
      })
    return await contract.read.count([BigInt(proposalKey)]).catch((error: Error) => {
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
          chainId: this.chainId,
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
          moderators: this.moderators ?? zeroAddress,
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
