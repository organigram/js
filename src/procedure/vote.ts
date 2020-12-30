import { web3, getAccount, EMPTY_ADDRESS, _linkBytecode, getNetwork, getLibraries } from '../web3'
import ProcedureVoteContract from '@organigram/contracts/build/contracts/VoteProcedure.json'
import { multihashToCid, cidToMultihash } from '../ipfs'
import Procedure from '.'

export const INTERFACE = `0xc9d27afe` // vote signature.

export type ProcedureVoteProposition = {
    moveKey: string,
    creator?: Address|null,
    quorumSize: string,
    voteDuration: string,
    enactmentDuration: string,
    majoritySize: string,
    vetoer?: Address|null,
    enactor?: Address|null
    metadata?: CID|null,
    vetoMetadata?: CID|null
}

export class ProcedureVote {
    private _address: Address
    votersOrgan: Address
    vetoersOrgan: Address
    enactorsOrgan: Address
    propositions: ProcedureVoteProposition[] = []

    constructor ({ address, votersOrgan, vetoersOrgan, enactorsOrgan, propositions }: {
        address: Address
        votersOrgan: Address
        vetoersOrgan: Address
        enactorsOrgan: Address
        propositions: ProcedureVoteProposition[]
    }) {
        this._address = address
        this.votersOrgan = votersOrgan
        this.vetoersOrgan = vetoersOrgan
        this.enactorsOrgan = enactorsOrgan
        this.propositions = propositions
    }

    public static async deploy(cid:CID, voters: Address, vetoers: Address, enactors: Address): Promise<Procedure> {
        const multihash:Multihash|null = cidToMultihash(`${cid}`)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const network = await getNetwork()
        const libraries = await getLibraries(network)
        if (!libraries.procedure[0] || !libraries.procedure[0].address)
            throw new Error("Procedure library not found.")
        if (!libraries.voteProposition[0] || !libraries.voteProposition[0].address)
            throw new Error("VoteProposition library not found.")
        const links = [
            { ...libraries.procedure[0], library: "ProcedureLibrary" },
            { ...libraries.voteProposition[0], library: "VotePropositionLibrary" }
        ]
        const from = await getAccount()
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi)
        // @ts-ignore
        return contract.deploy({
            data: await _linkBytecode(ProcedureVoteContract.bytecode, links),
            arguments: [ipfsHash, hashFunction, hashSize, voters, vetoers, enactors]
        })
        .send({ from })
        .then(contract => {
            return Procedure.load(contract.options.address)
        })
    }

    public static load = async (address: Address): Promise<ProcedureVote> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const votersOrgan:Address = await contract.methods.votersOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading voters organ address in vote procedure.", address, error.message)
            return ""
        })
        const vetoersOrgan:Address = await contract.methods.vetoersOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading vetoers organ address in vote procedure.", address, error.message)
            return ""
        })
        const enactorsOrgan:Address = await contract.methods.enactorsOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading enactors organ address in vote procedure.", address, error.message)
            return ""
        })
        const propositions: ProcedureVoteProposition[] = await ProcedureVote.loadPropositions(address)
        return new ProcedureVote({ address, votersOrgan, vetoersOrgan, enactorsOrgan, propositions })
    }

    public static loadPropositions = async (address: Address): Promise<ProcedureVoteProposition[]> => {
        let propositions: ProcedureVoteProposition[] = []
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const movesLength: number = await contract.methods.getMovesLength().call().then(parseInt)
        .catch((error: Error) => {
            console.warn("Error while loading moves length in procedure.", address, error.message)
            return 0
        })
        const iGenerator = function* () {
            let i = 0
            while (i < movesLength) yield i++
        }
        for await(let moveKey of iGenerator()) {
            const key = `${moveKey}`
            const proposition:ProcedureVoteProposition|null = await ProcedureVote.loadProposition(address, key)
            .catch((error: Error) => {
                console.warn("Error while loading proposition in vote procedure.", address, moveKey, error.message)
                return null
            })
            if (proposition) {
                const metadata = await ProcedureVote.loadPropositionMetadata(address, key)
                const vetoMetadata = await ProcedureVote.loadPropositionVetoMetadata(address, key)
                propositions.push({
                    ...proposition,
                    metadata,
                    vetoMetadata
                })
            }
        }
        return propositions
    }

    public static loadProposition = async (address: Address, moveKey: string): Promise<ProcedureVoteProposition|null> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        return contract.methods.getProposition(moveKey).call()
        .then(async (res: {
            0: Address,
            1: string,
            2: string,
            3: string,
            4: string,
            5: Address,
            6: Address
        }) => {
            let proposition: ProcedureVoteProposition = {
                moveKey,
                creator: res[0], 
                quorumSize: res[1],
                voteDuration: res[2],
                enactmentDuration: res[3],
                majoritySize: res[4],
                vetoer: res[5],
                enactor: res[6]
            }
            if (proposition.creator === EMPTY_ADDRESS)
                return null
            proposition.metadata = await ProcedureVote.loadPropositionMetadata(address, moveKey).catch(() => null)
            proposition.vetoMetadata = await ProcedureVote.loadPropositionVetoMetadata(address, moveKey).catch(() => null)
            return proposition
        })
    }

    public static loadPropositionMetadata = async (address: Address, moveKey: string): Promise<CID|null> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        return contract.methods.getPropositionMetadata(moveKey).call()
        .then((multihash: Multihash):CID|null => multihashToCid(multihash))
    }

    public static loadPropositionVetoMetadata = async (address: Address, moveKey: string): Promise<CID|null> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        return contract.methods.getPropositionVetoMetadata(moveKey).call()
        .then((multihash: Multihash):CID|null => multihashToCid(multihash))
    }

    propose = async (
        moveKey: string, cid: CID|string,
        quorumSize: string, voteDuration: string, enactmentDuration: string, majoritySize: string
    ): Promise<any> => {
        const multihash:Multihash|null = cidToMultihash(cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, this._address)
        const from = await getAccount()
        return contract.methods.propose(moveKey, ipfsHash, hashFunction, hashSize, quorumSize, voteDuration, enactmentDuration, majoritySize)
        .send({ from })
    }

    vote = async (moveKey: string, approval: boolean): Promise<any> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, this._address)
        const from = await getAccount()
        return contract.methods.vote(moveKey, approval)
        .send({ from })
    }

    veto = async (moveKey: string, cid: CID|string): Promise<any> => {
        const multihash:Multihash|null = cidToMultihash(cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, this._address)
        const from = await getAccount()
        return contract.methods.veto(moveKey, ipfsHash, hashFunction, hashSize)
        .send({ from })
    }

    count = async (moveKey: string): Promise<any> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, this._address)
        return contract.methods.count(moveKey).call()
    }

    enact = async (moveKey: string): Promise<any> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, this._address)
        const from = await getAccount()
        return contract.methods.enact(moveKey)
        .send({ from })
    }
}

export default ProcedureVote