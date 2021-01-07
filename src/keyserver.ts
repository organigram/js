import { concat } from 'uint8arrays'
import { EMPTY_CID, ipfsNode } from './ipfs'
import Organ from './organ'
import { Key } from './vault'
import { getAccount, getNetwork } from './web3'

export class Keyserver extends Organ {
    static async detect():Promise<Keyserver> {
        const network = await getNetwork().catch(error => {
            throw new Error("Not connected to Ethereum.")
        })
        const cache = localStorage.getItem("organigram-keyservers")
        const keyservers = cache ? JSON.parse(cache) : []
        const matches = keyservers.filter((n: { network: string, address: Address }) => n.network === network)
        // @todo : Allow multiple keyservers.
        if (matches[0] && matches[0].address)
            return Organ.load(matches[0].address)
            .then(organ => new Keyserver(organ))
        if (process.env.REACT_APP_KEYSERVER_ORGAN && network === "rinkeby")
            return Organ.load(process.env.REACT_APP_KEYSERVER_ORGAN)
            .then(organ => new Keyserver(organ))
        throw new Error("Detection not implemented.")
    }

    static async deploy():Promise<Keyserver> {
        // @todo : Save deployed keyserver address in localStorage per network.
        const organ = await Organ.deploy(EMPTY_CID)
        return new Keyserver(organ)
    }

    async save():Promise<void> {
        const networksCache = localStorage.getItem("organigram-keyservers")
        const networks = networksCache ? JSON.parse(networksCache) : []
        let match = networks.find((n:{network:string,address:Address}) => n.network === this.network && n.address === this.address)
        if (!match) {
            networks.push({
                network: this.network,
                address: this.address
            })
            localStorage.setItem("organigram-keyservers", JSON.stringify(networks))
        }
    }

    async hasKey(account:Address|null = null):Promise<boolean> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        return Organ.getEntryForAccount(this.address, account)
        .then(async ({ cid }: OrganEntry) => !!cid)
        .catch(() => false)
    }

    async loadKey(account:Address|null = null):Promise<Key> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        const ipfs = await ipfsNode
        return Organ.getEntryForAccount(this.address, account)
        .then(async ({ cid }: OrganEntry) => {
            const chunks = []
            for await (const chunk of ipfs.cat(cid)) {
                chunks.push(chunk)
            }
            const data: Uint8Array = await concat(chunks)
            const key = JSON.parse(Buffer.from(data).toString())
            return key
        })
        .catch(_error => null)
    }

    async uploadKey(key: Key, account:Address|null = null):Promise<Organ> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        // @todo : upload key.
        const ipfs = await ipfsNode
        const cid = await ipfs.add(JSON.stringify(key))
        .then((result:any) => result.cid)
        .catch((error:Error) => {
            console.error(error.message)
            throw new Error(error.message)
        })
        return this.addEntries([{
            index: "0",
            address: account,
            cid: cid || EMPTY_CID
        }])
        .then(data => {
            console.log("keyserver addEntries result", data)
            return data
        })
    }
}

export default Keyserver