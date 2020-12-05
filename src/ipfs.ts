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

const multihashToCid = ({ ipfsHash, hashFunction, hashSize }: Multihash): CID => {
    const multihash = Buffer.from(
        parseInt(hashFunction).toString(16).padStart(2, "0") +
        parseInt(hashSize).toString(16).padStart(2, "0") +
        ipfsHash.substring(2),
        'hex'
    )
    return new IPFS.CID(multihash)
}

const cidToMultihash = (cid: CID): Multihash | null => {
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

const EMPTY_CID:string = `QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH`
const EMPTY_MULTIHASH:Multihash|null = cidToMultihash(EMPTY_CID)

export {
    IPFS,
    ipfsNode,
    multihashToCid,
    cidToMultihash,
    EMPTY_CID,
    EMPTY_MULTIHASH
}