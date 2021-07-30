import { CID } from 'ipfs-core';
export declare type Address = string;
export declare type Metadata = {
    cid?: CID | undefined;
    data?: Object;
};
export declare type Multihash = {
    ipfsHash: string;
    hashFunction: string;
    hashSize: string;
};
export declare type LibraryKey = "organ" | "procedure" | "metadata";
export declare type Network = "mainnet" | "morden" | "ropsten" | "rinkeby" | "kovan" | "goerli" | "xdai" | "dev" | "truffle" | "organigr.am" | "private";
