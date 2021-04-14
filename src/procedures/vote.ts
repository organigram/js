import ProcedureVoteContract from '@organigram/contracts/build/contracts/VoteProcedure.json'
import { web3, getAccount } from '../web3'
import { cidToMultihash } from '../ipfs'
import Procedure from '../procedure'
import Web3 from 'web3'

export type Ballot = {
    proposalKey:string,
    start:string,
    votesCount:string,
    hasVoted:boolean
}

export default class ProcedureVote extends Procedure {
    static INTERFACE = `0xc9d27afe` // vote() signature.
    private contract:any
    quorumSize:string
    voteDuration:string
    majoritySize:string
    ballots: Ballot[]

    // Constructor needs to call Procedure constructor.
    constructor(
        address:Address,
        metadata:CID|null,
        proposers:Address,
        moderators:Address,
        deciders:Address,
        withModeration:boolean,
        proposals:ProcedureProposal[],
        quorumSize:string,
        voteDuration:string,
        majoritySize:string,
        ballots: Ballot[]
    ) {
        super(
            address,
            metadata,
            proposers,
            moderators,
            deciders,
            withModeration,
            proposals
        )
        // @ts-ignore
        this.contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        this.quorumSize = quorumSize
        this.voteDuration = voteDuration
        this.majoritySize = majoritySize
        this.ballots = ballots
    }

    // initialize() overrides Procedure initialize.
    static async initialize(
        address:Address,
        metadata:CID,
        proposers:Address,
        moderators:Address,
        deciders:Address,
        withModeration:boolean,
        quorumSize:string,
        voteDuration:string,
        majoritySize:string
    ):Promise<void> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const from = await getAccount()
        const multihash = cidToMultihash(metadata)
        if (!multihash)
            throw new Error("Wrong CID.")
        await contract.methods.initialize(
            address,
            multihash,
            proposers,
            moderators,
            deciders,
            withModeration,
            quorumSize,
            voteDuration,
            majoritySize
        )
        .send({ from })
    }

    static async loadBallot(address:Address, proposalKey:string):Promise<Ballot> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const ballot = await contract.methods.getBallot(proposalKey).call()
        if (!ballot.start)
            throw new Error("Ballot not found.")
        return {
            proposalKey,
            start: ballot.start.toString(),
            votesCount: ballot.votesCount.toString(),
            hasVoted: ballot.hasVoted
        }
    }

    static async loadBallots(address:Address):Promise<Ballot[]> {
        const data = await Procedure.loadData(address)
        const proposalsLength = Web3.utils.toBN(data.proposalsLength)
        let ballots:Ballot[] = []
        const iGenerator = function* () {
            let i = Web3.utils.toBN("0")
            while (i.lt(proposalsLength)) {
                yield i
                i = i.addn(1)
            }
        }
        for await(let proposalKey of iGenerator()) {
            const key:string = proposalKey.toString()
            const ballot:Ballot|null = await ProcedureVote.loadBallot(address, key)
            .catch((error: Error) => {
                console.warn("Error while loading ballot in vote procedure.", address, key, error.message)
                return null
            })
            if (ballot)
                ballots.push(ballot)
        }
        return ballots
    }

    static async load(address:Address): Promise<ProcedureVote> {
        const procedure = await Procedure.load(address)
        if (!procedure)
            throw new Error("Not a valid procedure.")
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const quorumSize = await contract.methods.quorumSize().call()
        const voteDuration = await contract.methods.voteDuration().call()
        const majoritySize = await contract.methods.majoritySize().call()
        const ballots = await ProcedureVote.loadBallots(address)
        return new ProcedureVote(
            procedure.address,
            procedure.metadata,
            procedure.proposers,
            procedure.moderators,
            procedure.deciders,
            procedure.withModeration,
            procedure.proposals,
            quorumSize.toString(),
            voteDuration.toString(),
            majoritySize.toString(),
            ballots
        )
    }
    
    async vote(proposalKey:string, approval:boolean):Promise<boolean> {
        const from = await getAccount()
        return from && this.contract.methods.vote(proposalKey, approval).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while voting.", super.address, proposalKey, error.message)
            return false
        })
    }
    
    async count(proposalKey:string):Promise<boolean> {
        const from = await getAccount()
        return from && this.contract.methods.count(proposalKey).call({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while voting.", super.address, proposalKey, error.message)
            return false
        })
    }
}