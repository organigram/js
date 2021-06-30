export type Address = string
export type Metadata = object | null
export type Multihash = {
  ipfsHash: string
  hashFunction: string
  hashSize: string
}
export type LibraryKey = "organ" | "procedure" | "metadata"
export type Network = "mainnet" | "morden" | "ropsten" | "rinkeby" | "kovan" | "goerli" | "xdai" | "dev" | "organigr.am" | "private"
