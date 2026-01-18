import type { ethers } from 'ethers';
export interface TransactionOptions {
    nonce?: number;
    onTransaction?: (tx: ethers.TransactionResponse, description: string) => void;
}
export interface Multihash {
    ipfsHash: string;
    hashFunction: string;
    hashSize: string;
}
export type LibraryKey = 'organ' | 'procedure' | 'metadata';
