import { CID } from 'ipfs-core'

export type Address = string
export type Metadata = {
  cid?: CID | undefined
  data?: Object
}
export type Multihash = {
  ipfsHash: string
  hashFunction: string
  hashSize: string
}
export type LibraryKey = "organ" | "procedure" | "metadata"
export type Network = "mainnet" | "morden" | "ropsten" | "rinkeby" | "kovan" | "goerli" | "xdai" | "dev" | "truffle" | "organigr.am" | "private"
