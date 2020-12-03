import uint8ArrayConcat from 'uint8arrays/concat'
import all from 'it-all'
import ProcedureContract from '@organigram/contracts/build/contracts/Procedure.json'
import { web3 } from '../web3'
import { ipfsNode, multihashToCid } from '../ipfs'

export const INTERFACE = `0x71dbd330` // getMove signature.

export interface ProcedureData {
    address: Address
    type: ProcedureType
    ProcedureClass: any // Store real Procedure Class.
    metadata: Metadata
    data: any
    movesLength: Number
    moves: any[]
}

export class Procedure {
    private address: Address = ""
    private type: ProcedureType = ""
    private ProcedureClass: any = ""
    private metadata: Metadata = {}
    private data: any = null
    private movesLength: Number = 0
    private moves: any[] = []

    public constructor({ address, type, ProcedureClass, metadata, data, movesLength, moves }: ProcedureData) {
        this.address = address
        this.type = type
        this.ProcedureClass = ProcedureClass
        this.metadata = metadata
        this.data = data
        this.movesLength = movesLength
        this.moves = moves
    }

    public static load = async (address: Address): Promise<Procedure> => {
        const isProcedure: boolean = await Procedure.isProcedure(address).catch(() => false)
        if (!isProcedure)
            throw new Error("Contract at address is not a Procedure.")
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        const type:ProcedureType = await Procedure.getType(address)
        const ProcedureClass: any = await Procedure.getClass(type)
        const metadata = await Procedure.loadMetadata(address)
        .catch(error => {
            console.warn("Error while loading procedure metadata.", address, error.message)
            return {}
        })
        const movesLength: Number = await contract.methods.getMovesLength().call().then(parseInt)
        .catch((error: Error) => {
            console.warn("Error while loading moves length in procedure.", address, error.message)
            return 0
        })
        let moves: any[] = []
        const iGenerator = function* () {
            let i = 1
            while (i <= movesLength) yield i++
        }
        for await(let moveKey of iGenerator()) {
            const move = await contract.methods.getMove(moveKey).call()
            .catch((error: Error) => {
                console.warn("Error while loading move in procedure.", address, moveKey, error.message)
                return null
            })
            if (move)
                moves.push(move)
        }
        const data = ProcedureClass && "load" in ProcedureClass ? await ProcedureClass.load(address)
            .catch((error: Error) => {
                console.warn("Error while loading procedure data.", address, error.message)
                return {}
            }) : null
        return new Procedure({ address, type, ProcedureClass, metadata, movesLength, moves, data })
    }

    public static async isProcedure(address: Address):Promise<boolean> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        const isERC165 = await contract.methods.supportsInterface("0x01ffc9a7").call()
        .catch(() => false)
        if (!isERC165) return false
        const isProcedure = await contract.methods.supportsInterface(INTERFACE).call()
        .catch(() => false)
        return isProcedure
    }

    public static async getType(address: Address):Promise<ProcedureType> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        const procedureType = Promise.all([
            require('./nomination').INTERFACE,
            require('./vote').INTERFACE
        ])
        .then(async (proceduresInterfaces:ProcedureType[]):Promise<ProcedureType> => {
            for await (var procedureInterface of proceduresInterfaces) {
                if(
                    await contract.methods.supportsInterface(procedureInterface).call()
                    .catch(() => false)
                )
                    return procedureInterface
            }
            return ""
        })
        return procedureType
    }

    public static async getClass(type:ProcedureType):Promise<any|null> {
        // @TODO : Automate finding load function.
        const ProcedureClass = Promise.all([
            require('./nomination'),
            require('./vote')
        ])
        .then(async ([
            { default: Nomination, INTERFACE: NominationInterface },
            { default: Vote, INTERFACE: VoteInterface }
        ]:any[]):Promise<any|null> => {
            switch (type) {
                case NominationInterface: return Nomination
                case VoteInterface: return Vote
                default: return null
            }
        })
        return ProcedureClass
    }

    public static loadMetadata = async (address: Address): Promise<Metadata> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        const ipfs = await ipfsNode
        if (!ipfs) {
            console.info("IPFS was not started. Starting IPFS.")
            await ipfs.start()
        }
        let metadata: {
            cid?: CID,
            data?: any
        } = {}
        try {
            metadata.cid = await contract.methods.getMetadata().call()
            .then((data: {
                ipfsHash:string,
                hashSize:string,
                hashFunction:string
            }):CID => multihashToCid({
                ipfsHash: data.ipfsHash,
                hashSize: parseInt(data.hashSize),
                hashFunction: parseInt(data.hashFunction)
            }))
        }
        catch(error) {
            console.warn("Error while computing IPFS Content ID for procedure metadata.", address, error.message)
        }
        if (metadata.cid) {
            try {
                // @ts-ignore
                metadata.data = uint8ArrayConcat(await all(ipfs.cat(metadata.cid)))
            }
            catch(error) {
                console.warn("Error while fetching metadata content for procedure.", address, error.message)
            }
        }
        return metadata
    }
}

export default Procedure