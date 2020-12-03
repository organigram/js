import { web3 } from './web3'
import all from 'it-all'
import OrganContract from '@organigram/contracts/build/contracts/Organ.json'
import { ipfsNode, multihashToCid } from './ipfs'
import uint8ArrayConcat from 'uint8arrays/concat'

export const ORGAN_CONTRACT_SIGNATURES: string[] = OrganContract.ast
    .nodes.find(n => n.name === "")
    ?.nodes?.map(n =>  n?.functionSelector || "")
    .filter(i => i !== "")
    || []

export interface OrganData {
    address: string
    metadata: Metadata
    procedures: OrganProcedure[]
    entries: OrganEntry[]
}

export class Organ {
    private address: string = ""
    private procedures: OrganProcedure[] = []
    private metadata: Metadata = {}
    private entries: OrganEntry[] = []

    public constructor({ address, procedures, metadata, entries }: OrganData) {
        this.address = address
        this.procedures = procedures
        this.metadata = metadata
        this.entries = entries
    }

    /* Organ API */

    public updateMetadata = async (metadata: Metadata): Promise<Organ> => {
        // @TODO : Call updateMetadata(uint256[] memory indexes)
        throw new Error("Not implemented.")
    }

    public addEntries = async (entries: OrganEntry[]): Promise<Organ> => {
        // @TODO : Call addEntries(OrganLibrary.Entry[] memory entries).
        throw new Error("Not implemented.")
    }

    public removeEntries = async (indexes: Number[]): Promise<Organ> => {
        // @TODO : Call removeEntries(uint256[] memory indexes)
        throw new Error("Not implemented.")
    }

    public replaceEntry = async (index: Number, entry: OrganEntry): Promise<Organ> => {
        // @TODO: Call replaceEntry(uint index, address payable addr, bytes32 ipfsHash, uint8 hashFunction, uint8 hashSize)
        throw new Error("Not implemented.")
    }

    public addProcedures = async (procedures: OrganProcedure[]): Promise<Organ> => {
        // @TODO : Call addProcedure(address procedure, bytes2 permissions)
        throw new Error("Not implemented.")
    }

    public removeProcedures = async (indexes: Number[]): Promise<Organ> => {
        // @TODO : Call removeProcedure(address procedure)
        throw new Error("Not implemented.")
    }

    public replaceProcedure = async (index: Number, procedure: OrganProcedure): Promise<Organ> => {
        // @TODO : Call replaceProcedure(address oldProcedure, address newProcedure, bytes2 permissions)
        throw new Error("Not implemented.")
    }

    /* Static API */

    public static async load(address: string): Promise<Organ> {
        const isOrgan: boolean = await Organ.isOrgan(address).catch(() => false)
        if (!isOrgan)
            throw new Error("Contract at address is not an Organ.")
        const metadata: Metadata = await Organ.loadMetadata(address)
        .catch(error => {
            console.warn("Error while loading organ's metadata", address, error.message)
            return {}
        })
        const procedures: OrganProcedure[] = await Organ.loadProcedures(address)
        .catch(error => {
            console.warn("Error while loading organ's procedures", address, error.message)
            return []
        })
        const entries = await Organ.loadEntries(address)
        .catch(error => {
            console.warn("Error while loading organ's entries", address, error.message)
            return []
        })
        return new Organ({ address, procedures, metadata, entries })
    }

    public static async isOrgan(address: Address):Promise<boolean> {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, address)
        const isERC165 = await contract.methods.supportsInterface("0x01ffc9a7").call()
        .catch(() => false)
        if (!isERC165) return false
        const ORGAN_INTERFACE = `0xbae78d7b`    // getEntry.
        const isOrgan = await contract.methods.supportsInterface(ORGAN_INTERFACE).call()
        .catch(() => false)
        return isOrgan
    }

    public static loadMetadata = async (address: Address): Promise<Metadata> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, address)
        const ipfs = await ipfsNode
        if (!ipfs) {
            console.info("IPFS was not started. Starting IPFS.")
            await ipfs.start()
        }
        let metadata: { cid?: CID, data?: any } = {}
        try {
            metadata.cid = await contract.methods.getMetadata().call()
            .then((data: {
                ipfsHash:string,
                hashSize:string,
                hashFunction:string
            }):CID => {
                return multihashToCid({
                    ipfsHash: data.ipfsHash,
                    hashSize: parseInt(data.hashSize),
                    hashFunction: parseInt(data.hashFunction)
                })
            })
        }
        catch (error) {
            console.warn("Error while computing IPFS Content ID for organ metadata.", address, error.message)
        }
        if (metadata.cid) {
            try {
                // @ts-ignore
                metadata.data = uint8ArrayConcat(await all(ipfs.cat(metadata.cid)))
            }
            catch(error) {
                console.warn("Error while loading metadata for organ.", address, error.message)
            }
        }
        return metadata
    }

    public static loadProcedures = async (address: Address): Promise<OrganProcedure[]> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, address)

        const length = await contract.methods.getProceduresLength().call()
        .catch(() => "0")
        if (length === "0") return []

        let i = 1, promises = []
        for (i ; String(i) !== length ; i++) {
            const index = String(i)
            promises.push(
                contract.methods.getProcedure(i).call()
                .catch((e: Error) => console.error("Error", e.message))
                .then((data: any) => data && {
                    address: data.procedure,
                    permissions: data.permissions.toString()
                })
            )
        }

        return Promise.all(promises)
    }

    public static loadEntries = async (address: Address): Promise<OrganEntry[]> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, address)
        const ipfs = await ipfsNode
        if (!ipfs) {
            console.info("IPFS was not started. Starting IPFS.")
            await ipfs.start().catch((e:Error) => console.warn(e.message))
        }

        const length = await contract.methods.getEntriesLength().call()
        .catch(() => "0")
        if (length === "0") return []

        var i = 1, promises = []
        for (i ; String(i) !== length ; i++) {
            const index = String(i)
            promises.push(
                contract.methods.getEntry(index).call()
                .then(async ({ addr, ipfsHash, hashFunction, hashSize }: {
                    addr: Address,
                    ipfsHash: string, hashFunction: string, hashSize: string
                }) => {
                    let entry:OrganEntry = { index, address: addr, cid: null }
                    try {
                        entry.cid = multihashToCid({
                            ipfsHash,
                            hashSize: parseInt(hashSize),
                            hashFunction: parseInt(hashFunction)
                        })
                    }
                    catch(error) {
                        console.warn("Error while computing IPFS Content ID for entry.", address, index, error.message)
                    }
                    if (entry.cid) {
                        try {
                            // @ts-ignore
                            entry.data = uint8ArrayConcat(await all(ipfs.cat(entry.cid)))
                        }
                        catch(error) {
                            console.warn("Error while loading data hash for entry.", address, index, error.message)
                        }
                    }
                    return entry
                })
                .catch((e: Error) => console.error("Error", e.message))
            )
        }

        return Promise.all(promises)
    }

    /* Sync API */

    public reload = async(): Promise<Organ> => {
        const { procedures, metadata, entries } = await Organ.load(this.address)
        this.procedures = procedures
        this.metadata = metadata
        this.entries = entries
        return this
    }

    public reloadEntries = async (): Promise<Organ> => {
        this.entries = await Organ.loadEntries(this.address)
        .catch(error => {
            console.warn("Error while reloading organ's entries", this.address, error.message)
            return this.entries
        })
        return this
    }

    public reloadProcedures = async (): Promise<Organ> => {
        this.procedures = await Organ.loadProcedures(this.address)
        .catch(error => {
            console.warn("Error while reloading organ's procedures", this.address, error.message)
            return this.procedures
        })
        return this
    }

    public reloadMetadata = async (): Promise<Organ> => {
        this.metadata = await Organ.loadMetadata(this.address)
        .catch(error => {
            console.warn("Error while reloading organ's metadata", this.address, error.message)
            return this.metadata
        })
        return this
    }
}

export default Organ