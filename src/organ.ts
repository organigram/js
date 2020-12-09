import { EMPTY_ADDRESS, getLibraries, getNetwork, web3, _linkBytecode } from './web3'
import all from 'it-all'
import uint8ArrayConcat from 'uint8arrays/concat'
import { CID } from 'ipfs-core'
import OrganContract from '@organigram/contracts/build/contracts/Organ.json'
import { ipfsNode, multihashToCid, cidToMultihash } from './ipfs'
import { getAccount } from './web3'

export const ORGAN_CONTRACT_SIGNATURES: string[] = OrganContract.ast
    .nodes.find(n => n.name === "")
    ?.nodes?.map(n =>  n?.functionSelector || "")
    .filter(i => i !== "")
    || []

export interface OrganData {
    address: string
    balance: string
    metadata: Metadata
    procedures: OrganProcedure[]
    entries: OrganEntry[]
}

export class Organ {
    address: string = ""
    balance: string = "n/a"
    procedures: OrganProcedure[] = []
    metadata: Metadata = {}
    entries: OrganEntry[] = []

    public constructor({ address, balance, procedures, metadata, entries }: OrganData) {
        this.address = address
        this.balance = balance
        this.procedures = procedures
        this.metadata = metadata
        this.entries = entries
    }

    /* Organ API */

    public updateMetadata = async(cid:CID = new CID("QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH")) => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
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

    public addEntries = async (entries: OrganEntry[]): Promise<Organ> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const _entries: {
            addr: Address, ipfsHash: string, hashFunction: string, hashSize: string
        }[] = entries.map(e => {
            let multihash:Multihash|null = cidToMultihash(new CID(e.cid))
            if (!multihash)
                throw new Error(`Wrong IPFS Content ID '${e.cid}' for entry.`)
            const { ipfsHash, hashFunction, hashSize } = multihash
            return { addr: e.address, ipfsHash, hashFunction, hashSize }
        })
        const from = await getAccount()
        return from && contract.methods.addEntries(_entries).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding entries to organ.", this.address, error.message)
            return false
        })
    }

    public removeEntries = async (indexes: string[]):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.removeEntries(indexes).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while removing entries in organ.", this.address, error.message)
            return false
        })
    }

    public replaceEntry = async (index: Number, entry: OrganEntry): Promise<Organ> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const multihash:Multihash|null = cidToMultihash(entry.cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const from = await getAccount()
        return from && contract.methods.replaceEntry(index, entry.address, ipfsHash, hashFunction, hashSize).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while replacing entry in organ.", this.address, error.message)
            return false
        })
    }

    public addProcedure = async (procedure: OrganProcedure): Promise<Organ> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.addProcedure(procedure.address, procedure.permissions).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding procedures in organ.", this.address, error.message)
            return false
        })
    }

    public removeProcedure = async (procedure: Address): Promise<Organ> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const from = await getAccount()
        return from && contract.methods.removeProcedure(procedure).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while removing procedure in organ.", this.address, error.message)
            return false
        })
    }

    public replaceProcedure = async (oldProcedure: Address, newOrganProcedure: OrganProcedure): Promise<Organ> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi, this.address)
        const { address, permissions } = newOrganProcedure
        const from = await getAccount()
        return from && contract.methods.replaceProcedure(oldProcedure, address, permissions).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while replacing procedure in organ.", this.address, error.message)
            return false
        })
    }

    /* Static API */

    public static async deploy(cid:CID): Promise<Organ> {
        const multihash:Multihash|null = cidToMultihash(cid)
        if (!multihash)
            throw new Error("Wrong CID.")
        const { ipfsHash, hashFunction, hashSize } = multihash
        const network = await getNetwork()
        const libraries = await getLibraries(network)
        if (!libraries.organ[0] || !libraries.organ[0].address)
            throw new Error("Organ library not found.")
        const links = [{ ...libraries.organ[0], library: "OrganLibrary" }]
        const from = await getAccount()
        // @ts-ignore
        const contract = new web3.eth.Contract(OrganContract.abi)
        // @ts-ignore
        return contract.deploy({
            data: await _linkBytecode(OrganContract.bytecode, links),
            arguments: [from, ipfsHash, hashFunction, hashSize]
        })
        .send({ from })
        .then(contract => {
            return Organ.load(contract.options.address)
        })
    }

    public static async load(address: string): Promise<Organ> {
        const isOrgan: boolean = await Organ.isOrgan(address).catch(() => false)
        if (!isOrgan)
            throw new Error("Contract at address is not an Organ.")
        const balance:string = await Organ.getBalance(address)
        .catch(() => "n/a")
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
        return new Organ({ address, balance, procedures, metadata, entries })
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

    public static getBalance = async (address: Address): Promise<string> => {
        const balance = await web3.eth.getBalance(address)
        return `${balance}`
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
            .then((multihash: Multihash):CID => {
                return multihashToCid(multihash)
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

        let i = 0, promises = []
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

        var i = 0, promises = []
        for (i ; String(i) !== length ; i++) {
            const index = String(i)
            promises.push(
                contract.methods.getEntry(index).call()
                .then(async ({ addr, ipfsHash, hashFunction, hashSize }: {
                    addr: Address,
                    ipfsHash: string, hashFunction: string, hashSize: string
                }) => {
                    if (addr === EMPTY_ADDRESS && (!parseInt(hashFunction, 16) || !parseInt(hashSize)))
                        return null
                    let entry:OrganEntry = { index, address: addr, cid: null }
                    try {
                        entry.cid = multihashToCid({ ipfsHash, hashSize, hashFunction })
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

        return Promise.all(promises).then(entries => entries.filter(e => !!e))
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