import { CID } from 'ipfs-core'
import ProcedureContract from '@organigram/contracts/build/contracts/Procedure.json'
import { EMPTY_ADDRESS, web3 } from '../web3'
import { cidToMultihash, EMPTY_CID, ipfsNode, multihashToCid, parseJSON } from '../ipfs'
import { getAccount } from '../web3'

export const INTERFACE = `0x71dbd330` // getMove signature.

export class Procedure {
    address: Address = ""
    type: ProcedureType = ""
    // Store real Procedure Class.
    ProcedureClass: any = ""
    metadata: Metadata = {}
    data: any = null
    moves: ProcedureMove[] = []

    constructor({ address, type, ProcedureClass, metadata, data, moves }: {
        address: Address
        type: ProcedureType
        ProcedureClass: any
        metadata: Metadata
        data: any
        moves: any[]
    }) {
        this.address = address
        this.type = type
        this.ProcedureClass = ProcedureClass
        this.metadata = metadata
        this.data = data
        this.moves = moves
    }

    static deploy = async (type: ProcedureType, cid: CID, args: any[]) => {
        let ProcedureClass = null
        switch (type) {
            case 'nomination':
                ProcedureClass = (await require('./nomination')).default
                break
            case 'vote':
                ProcedureClass = (await require('./vote')).default
                break
            default:
                throw new Error("Unknown procedure type.")
        }
        return ProcedureClass && ProcedureClass.deploy(cid, ...args)
    }

    static load = async (address: Address): Promise<Procedure> => {
        const isProcedure: boolean = await Procedure.isProcedure(address).catch(() => false)
        // if (!isProcedure)
        //     throw new Error("Contract at address is not a Procedure.")
        const type:ProcedureType = await Procedure.getType(address)
        const ProcedureClass: any = await Procedure.getClass(type)
        const metadata = await Procedure.loadMetadata(address).catch(() => ({}))
        const moves = await Procedure.loadMoves(address)
        const data = ProcedureClass && "load" in ProcedureClass
            ? await ProcedureClass.load(address)
                .catch((error: Error) => {
                    console.warn("Error while loading procedure data.", address, error.message)
                    return null
                })
            : null
        return new Procedure({ address, type, ProcedureClass, metadata, moves, data })
    }

    static async isProcedure(address: Address):Promise<boolean> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        const isERC165 = await contract.methods.supportsInterface("0x01ffc9a7").call()
        .catch(() => false)
        if (!isERC165) return false
        const isProcedure = await contract.methods.supportsInterface(INTERFACE).call()
        .catch(() => false)
        return isProcedure
    }

    static async getType(address: Address):Promise<ProcedureType> {
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

    static async getClass(type:ProcedureType):Promise<any|null> {
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

    static getMovesLength = (address: Address): Promise<number> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        // @todo : Use BigNumbers
        return contract.methods.getMovesLength().call().then(parseInt)
    }

    static loadMoves = async (address: Address): Promise<ProcedureMove[]> => {
        const movesLength: number = await Procedure.getMovesLength(address)
        .catch((error: Error) => {
            console.warn("Error while loading moves length in procedure.", address, error.message)
            return 0
        })
        let moves: any[] = []
        const iGenerator = function* () {
            let i = 0
            while (i < movesLength) yield i++
        }
        for await(let moveKey of iGenerator()) {
            const key = `${moveKey}`
            const move:ProcedureMove|null = await Procedure.loadMove(address, key)
            .catch((error: Error) => {
                console.warn("Error while loading move in procedure.", address, moveKey, error.message)
                return null
            })
            if (move)
                moves.push(move)
        }
        return moves
    }

    static loadMove = async (address: Address, moveKey: string): Promise<ProcedureMove> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, address)
        return await contract.methods.getMove(moveKey).call()
        .then (({ creator, locked, applied, processing, metadata, operations }:{
            creator: Address, locked: boolean, applied:boolean, processing: boolean,
            metadata: Multihash, operations: any[]
        }) => ({
            key: moveKey, creator, locked, applied, processing,
            metadata: {
                cid: metadata && metadata.ipfsHash && multihashToCid(metadata)
            },
            operations: operations.map((operation, i) => {
                const [index, organ, value, _operationType, callData, processed] = operation
                const funcSignature = callData.slice(0, 10)
                let op: string|null = null
                // @todo : Parse params from callData.
                let params: any[] = []
                switch (funcSignature) {
                    case "0x981d5e7b":
                        op = "addEntries"
                        break
                    case "0x7615eb81":
                        op = "removeEntries"
                        break
                    case "0x91bdfe63":
                        op = "replaceEntry"
                        break
                    case "0x7f0a4e27":
                        op = "addProcedure"
                        break
                    case "0x19b9404c":
                        op = "removeProcedure"
                        break
                    case "0xd0922d4a":
                        op = "replaceProcedure"
                        break
                    default:
                }
                return { index, organ, value, callData, processed, funcSignature, op, params, _operationType }
            })
        }))
    }

    static loadMetadata = async (address: Address): Promise<Metadata> => {
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
            .then((multihash: Multihash):CID => multihashToCid(multihash))
        }
        catch(error) {
            console.warn("Error while computing IPFS Content ID for procedure metadata.", address, error.message)
        }
        if (metadata.cid) {
            try {
                metadata.data = await parseJSON(metadata.cid)
            }
            catch(error) {
                console.warn("Error while fetching metadata content for procedure.", address, error.message)
            }
        }
        return metadata
    }

    /**
     * Procedure API.
     */

    createMove = async (cid:CID = new CID("QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH")):Promise<string> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const multihash:Multihash|null = cidToMultihash(cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const from = await getAccount()
        if (!from)
            throw new Error("No account selected.")
        return contract.methods.createMove(ipfsHash, hashFunction, hashSize).send({ from })
    }
    
    lockMove = async (moveKey: string):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.lockMove(moveKey).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while locking move.", this.address, moveKey, error.message)
            return false
        })
    }

    updateMetadata = async(cid:CID = new CID("QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH")) => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const multihash:Multihash|null = cidToMultihash(cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const from = await getAccount()
        return from && contract.methods.updateMetadata(ipfsHash, hashFunction, hashSize).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while updating metadata.", this.address, error.message)
            return false
        })
    }

    updateAdmin = async(address: Address) => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.updateAdmin(address).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while updating admin.", this.address, error.message)
            return false
        })
        
    }

    moveAddEntries = async (
        moveKey: string,
        organ: Address,
        entries: OrganEntry[],
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        if (!from)
            throw new Error("No account selected.")
        const _entries = entries
        .map(e => {
            let multihash:Multihash|null = null
            if (e.cid) {
                try {
                    multihash = cidToMultihash(new CID(e.cid))
                } catch (error) {
                    console.error("Unable to find a CID for this entry.", error.message)
                }
            }
            if (!multihash) multihash = cidToMultihash(new CID(EMPTY_CID))
            return {
                addr: e.address || EMPTY_ADDRESS,
                ipfsHash: multihash?.ipfsHash,
                hashFunction: multihash?.hashFunction,
                hashSize: multihash?.hashSize
            }
        })
        .filter(e => !!e)
        return contract.methods.moveAddEntries(moveKey, organ, _entries, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding entries in move.", this.address, moveKey, error.message)
            return false
        })
    }

    moveRemoveEntries = async (
        moveKey: string,
        organ: Address,
        indexes: string[],
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.moveRemoveEntries(moveKey, organ, indexes, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while removing entry in move.", this.address, moveKey, error.message)
            return false
        })
    }

    moveReplaceEntry = async (
        moveKey: string,
        organ: Address,
        entry: OrganEntry,
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        let multihash:Multihash|null = entry.cid && CID.isCID(entry.cid)
            ? cidToMultihash(new CID(entry.cid))
            : cidToMultihash(new CID(EMPTY_CID))
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const address = entry.address || EMPTY_ADDRESS
        const from = await getAccount()
        return from && contract.methods.moveReplaceEntry(
            moveKey, organ, entry.index, address,
            ipfsHash, hashFunction, hashSize, lock
        )
        .send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while replacing entry in move.", this.address, moveKey, error.message)
            return false
        })
    }

    moveAddProcedure = async (
        moveKey: string,
        organ: Address,
        procedure: OrganProcedure,
        lock: boolean = false
    ): Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.moveAddProcedure(moveKey, organ, procedure.address, procedure.permissions, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding procedures in move.", this.address, moveKey, error.message)
            return false
        })
    }

    moveRemoveProcedure = async (
        moveKey: string,
        organ: Address,
        procedure: OrganProcedure,
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.moveRemoveProcedure(moveKey, organ, procedure.address, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while removing procedure in move.", this.address, moveKey, error.message)
            return false
        })
    }

    moveReplaceProcedure = async (
        moveKey: string,
        organ: Address,
        oldProcedure: Address,
        newProcedure: OrganProcedure,
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.moveReplaceProcedure(moveKey, organ, oldProcedure, newProcedure.address, newProcedure.permissions, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while replacing procedure in move.", this.address, moveKey, error.message)
            return false
        })
    }
    
    // @todo : Secure _call data.
    moveCall = async (
        moveKey: string,
        _call: string,
        lock: boolean = false
    ):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.moveCall(moveKey, _call, lock).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding special call in move.", this.address, moveKey, error.message)
            return false
        })
    }

    getMovesLength = async () => {
        return Procedure.getMovesLength(this.address)
    }

    /**
     * Sync API.
     */

    reloadMoves = async (): Promise<Procedure> => {
        const moves = await Procedure.loadMoves(this.address)
        return new Procedure({
            address: this.address,
            ProcedureClass: this.ProcedureClass,
            metadata: this.metadata,
            type: this.type,
            data: this.data,
            moves
        })
    }

    reloadMove = async (moveKey: string): Promise<Procedure> => {
        const move = await Procedure.loadMove(this.address, moveKey)
        const moves = this.moves.map(m => m.key === moveKey ? move : m)
        return new Procedure({
            address: this.address,
            ProcedureClass: this.ProcedureClass,
            metadata: this.metadata,
            type: this.type,
            data: this.data,
            moves
        })
    }

    reloadMetadata = async (): Promise<Procedure> => {
        const moves = await Procedure.loadMoves(this.address)
        return new Procedure({
            address: this.address,
            ProcedureClass: this.ProcedureClass,
            metadata: this.metadata,
            type: this.type,
            data: this.data,
            moves
        })
    }
}

export default Procedure