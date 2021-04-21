import { concat } from 'uint8arrays'
import { CID, EMPTY_CID, ipfsNode } from './ipfs'
import Organ from './organ'
import { Key } from './vault'
import { getAccount } from './web3'

export default class Keyserver extends Organ {
    static async load(address:Address):Promise<Keyserver> {
        return Organ.load(address).then(o => new Keyserver(o))
    }

    async hasKey(account: Address | null = null): Promise<boolean> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        return Organ.loadEntryForAccount(this.address, account)
        .then(async (value: OrganEntry|null) => {
            return !!value?.cid
        })
        .catch(() => false)
    }

    async loadKey(account: Address | null = null): Promise<Key> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        const ipfs = await ipfsNode
        return Organ.loadEntryForAccount(this.address, account)
        .then(async (value: OrganEntry|null) => {
            if (!value || !value.cid)
                throw new Error("Key not found.")
            const chunks = []
            for await (const chunk of ipfs.cat(value.cid)) {
                chunks.push(chunk)
            }
            const data: Uint8Array = await concat(chunks)
            const key = JSON.parse(Buffer.from(data).toString())
            return key
        })
        .catch(_error => null)
    }

    async uploadKey(key: Key, account: Address | null = null): Promise<Organ> {
        if (!account)
            account = await getAccount()
        if (!account)
            throw new Error("No account selected.")
        // @todo : upload key.
        const ipfs = await ipfsNode
        const cid = await ipfs.add(JSON.stringify(key))
            .then((result: any) => result.cid)
            .catch((error: Error) => {
                console.error(error.message)
                throw new Error(error.message)
            })
        return this.addEntries([{
            index: "0",
            address: account,
            cid: cid || EMPTY_CID
        }])
    }
}