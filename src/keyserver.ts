import { concat } from 'uint8arrays'
import { EMPTY_CID, ipfsNode } from './ipfs'
import Organ from './organ'
import { Key } from './vault'
import { getAccount } from './web3'

// @todo : Move to client-js, detect keyserver address.
export class Keyserver extends Organ {
    static async detect():Promise<Keyserver> {
        // @todo : Detect keyserver.
        if (!process.env.REACT_APP_KEYSERVER_ADDRESS)
            throw new Error("Detection not implemented.")
        return Organ.load(process.env.REACT_APP_KEYSERVER_ADDRESS)
        .then(organ => new Keyserver(organ))
    }

    static async deploy():Promise<Keyserver> {
        // @todo : Save deployed keyserver address in localStorage per network.
        const organ = await Organ.deploy(EMPTY_CID)
        return new Keyserver(organ)
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