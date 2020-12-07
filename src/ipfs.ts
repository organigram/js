import * as IPFS from 'ipfs-core'
// @ts-ignore
import { getIpfs, providers } from 'ipfs-provider'

const ipfsNode:Promise<any> = getIpfs({
    // loadHttpClientModule: () => require('ipfs-http-client'),
    providers: [
        // Try window.ipfs.
        providers.windowIpfs({
            permissions: { commands: ['add', 'cat', 'get'] }
        }),
        // @todo : Try "/api/v0/" on the same Origin as the page
        // httpClient({ loadHttpClientModule: () => require('ipfs-http-client') }),
        // Fallback to spawning embedded js-ipfs running in-page
        providers.jsIpfs({
            // js-ipfs package is used only once, as a last resort
            loadJsIpfsModule: () => require('ipfs-core'),
            options: {} // pass config: https://github.com/ipfs/js-ipfs/blob/master/packages/ipfs/docs/MODULE.md#ipfscreateoptions
        })
    ]
})
.then(async (res: any) => {
    if (res.ipfs?.enable) {
        await res.ipfs.enable({ commands: ['id', 'add', 'cat', 'get'] })
        console.info('IPFS enabled.')
    }
    return res.ipfs
})

const multihashToCid = ({ ipfsHash, hashFunction, hashSize }: Multihash): CID|null => {
    if (!parseInt(hashFunction) || !parseInt(hashSize))
        return null
    const multihash = Buffer.from(
        parseInt(hashFunction).toString(16).padStart(2, "0") +
        parseInt(hashSize).toString(16).padStart(2, "0") +
        ipfsHash.substring(2),
        'hex'
    )
    try {
        return new IPFS.CID(multihash)
    }
    catch(e) {
        console.warn("Error computing IPFS CID from given multihash.")
        return null
    }
}

const cidToMultihash = (cid: CID|string): Multihash|null => {
    if (typeof cid === "string")
        cid = new IPFS.CID(cid)
    const multihash = cid?.hash?.data ?
        Buffer.from(cid.hash.data)
        : cid?.multihash ?
            Buffer.from(cid.multihash)
            : null
    return multihash && {
        ipfsHash: `0x${multihash.slice(2).toString('hex')}`,
        hashSize: `0x${multihash.slice(1, 2).toString('hex')}`,
        hashFunction: `0x${multihash.slice(0,1).toString('hex')}`
    }
}

const urlToCID = (url: string):CID|null => {
    try {
        // Remove https://ipfs.io/ipfs/
        return new CID(url.substring(0, 21))
    }
    catch (error) {
        console.warn("Unable to convert IPFS url to CID.")
        return null
    }
}

const EMPTY_CID:string = `QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH`
const EMPTY_MULTIHASH:Multihash|null = cidToMultihash(EMPTY_CID)

const CID = IPFS.CID

export {
    IPFS,
    ipfsNode,
    multihashToCid,
    cidToMultihash,
    urlToCID,
    EMPTY_CID,
    EMPTY_MULTIHASH,
    CID
}