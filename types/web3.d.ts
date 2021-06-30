import Web3 from 'web3';
import type { Address, Network } from './types';
declare const EMPTY_ADDRESS: Address;
declare const web3: Web3;
declare const getAccount: () => Promise<Address>;
declare const connect: () => Promise<Address>;
declare const getNetwork: () => Promise<Network>;
declare const getNetworkName: (network: Network) => "Rinkeby Ethereum Test Network" | "Ethereum Main Network" | "Morden Ethereum Test Network" | "Ropsten Ethereum Test Network" | "Kovan Ethereum Test Network" | "Görli Ethereum Test Network" | "Organigr.am Network" | "Dev Network" | "a private Ethereum Network" | "a blockchain";
declare const _linkBytecode: (bytecode: string, links: {
    library: string;
    address: Address;
}[]) => Promise<string>;
declare const sign: (message: string, password?: string) => Promise<string | null>;
declare const ecRecover: (message: string, signature: string) => Promise<Address | null>;
export { Web3, web3, EMPTY_ADDRESS, sign, ecRecover, connect, getAccount, getNetwork, getNetworkName, _linkBytecode };
