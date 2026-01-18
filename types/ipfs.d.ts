import { CID } from 'multiformats'
import type { Multihash } from './types'
import type { IPFS } from 'ipfs-core-types'
declare let ipfs: IPFS
declare const multihashToCid: ({ ipfsHash, hashFunction, hashSize }: Multihash) => CID | undefined
declare const cidToMultihash: (cid: CID | string) => Multihash | undefined
declare const uint8ArrayToString: (uint8Array: Uint8Array) => string
declare const parseJSON: (cid: CID | string, ipfs: IPFS) => Promise<object>
declare const EMPTY_CID = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH'
declare const EMPTY_MULTIHASH: Multihash
export { CID, ipfs, multihashToCid, cidToMultihash, uint8ArrayToString, parseJSON, EMPTY_CID, EMPTY_MULTIHASH }
