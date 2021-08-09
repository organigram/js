import IPFS, { CID } from 'ipfs-core'
import toString from 'uint8arrays/to-string'
import concat from 'uint8arrays/concat'
// @ts-ignore
import { getIpfs, providers } from 'ipfs-provider'
import { Multihash } from './types'
const { jsIpfs } = providers

const ipfsNode: Promise<any> = getIpfs({
  providers: [
    // httpClient({
    //     loadHttpClientModule: () => require('ipfs-http-client'),
    // }),
    jsIpfs({
      loadJsIpfsModule: () => require('ipfs-core'),
      options: {}
    })
  ]
})
  .then(async ({ ipfs }: any) => {
    if (ipfs?.enable) {
      await ipfs.enable({ commands: ['id', 'add', 'cat', 'get'] })
      console.info('IPFS enabled.')
    }
    return ipfs
  })

const multihashToCid = ({ ipfsHash, hashFunction, hashSize }: Multihash): CID | undefined => {
  if (!parseInt(hashFunction) || !parseInt(hashSize)) {
    return undefined
  }
  const multihash = Buffer.from(
    parseInt(hashFunction).toString(16).padStart(2, "0") +
    parseInt(hashSize).toString(16).padStart(2, "0") +
    ipfsHash.substring(2),
    'hex'
  )
  try {
    return CID.decode(multihash)
  }
  catch (e) {
    console.warn("Error computing IPFS CID from given multihash.")
    return undefined
  }
}

const cidToMultihash = (cid: CID | string): Multihash | undefined => {
  if (!cid) {
    cid = EMPTY_CID
  }
  if (typeof cid === "string") {
    cid = CID.parse(cid)
  }
  const multihash = cid?.bytes && Buffer.from(cid.bytes)
  return multihash && {
    ipfsHash: `0x${multihash.slice(2).toString('hex')}`,
    hashSize: `0x${multihash.slice(1, 2).toString('hex')}`,
    hashFunction: `0x${multihash.slice(0, 1).toString('hex')}`
  }
}

const uint8ArrayToString = (uint8Array: Uint8Array) => toString(uint8Array)

const parseJSON = async (cid: CID | string): Promise<object | any[]> => {
  const ipfs = await Promise.resolve(ipfsNode)
  const chunks: Uint8Array[] = []
  for await (const chunk of ipfs.cat(cid)) {
    chunks.push(chunk)
  }
  try {
    // @ts-ignore
    return JSON.parse(toString(concat(chunks)))
  } catch (error) {
    throw new Error(error.message)
  }
}

const EMPTY_CID: string = `QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH`
const EMPTY_MULTIHASH = cidToMultihash(EMPTY_CID)

export {
  IPFS,
  ipfsNode,
  multihashToCid,
  cidToMultihash,
  uint8ArrayToString,
  parseJSON,
  EMPTY_CID,
  EMPTY_MULTIHASH,
  CID
}