import uint8ArrayConcat from 'uint8arrays/concat'
import all from 'it-all'
import ProcedureABI from '@organigram/contracts/abis/Procedure.json'
import { web3 } from './web3'
import { ipfsNode, multihashToCid } from './ipfs'

export interface ProcedureData {
    address: Address
    type: ProcedureType
    metadata: Metadata
    data: object
}

export class Procedure {
    private address: Address = ""
    private type: ProcedureType = ""
    private metadata: Metadata = {}
    private data: object = {}

    public constructor({ address, type, metadata, data }: ProcedureData) {
        this.address = address
        this.type = type
        this.metadata = metadata
        this.data = data
    }

    public static load = async (address: Address): Promise<Procedure> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureABI, address)
        // @TODO : Fetch from contract signature.
        const type = "nomination"
        const metadata = await Procedure.loadMetadata(address)
        .catch(error => {
            console.warn("Error while loading procedure metadata.", address, error.message)
            return {}
        })
        const data = await Procedure.loadData(type, address)
        .catch(error => {
            console.warn("Error while loading procedure data.", address, error.message)
            return {}
        })
        return new Procedure({ address, type, metadata, data })
    }


    public static loadMetadata = async (address: Address): Promise<Metadata> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureABI, address)
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

    public static loadData = async (type: string, address: Address): Promise<object> => {
        // @TODO : Automate finding load function.
        switch (type) {
            case 'nomination':
                const ProcedureNomination:any = (await import('./procedures/nomination')).default
                return ProcedureNomination.load(address)
            case 'vote':
                const ProcedureVote:any = (await import('./procedures/vote')).default
                return ProcedureVote.load(address)
            default:
                return {}
        }
    }
}

export default Procedure