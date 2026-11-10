import { type PublicClient, type WalletClient } from 'viem';
import type { TransactionOptions } from './organigramClient';
import { type ContractClients, type OrganigramTransactionReceipt, type OrganigramContract } from './contracts';
/** One entry of an organ registry: a member, a document, or both. */
export interface OrganEntry {
    /** Position in the registry, starting at 1. */
    index: string;
    /** Ethereum address of the member, or the zero address. */
    address: string;
    /** Reference to a document, or an empty string. */
    cid: string;
    /** Display name. */
    name?: string | null;
}
/** An entry to add to an organ: an address, a document reference, or both. */
export interface OrganEntryInput {
    /** Ethereum address of the member. */
    address?: string;
    /** Reference to a document. */
    cid?: string;
}
/** The permissions one address holds on an organ. */
export interface OrganPermission {
    /** Address granted the permissions, usually a procedure. */
    permissionAddress: string;
    /** Bit field of `PERMISSIONS` flags. */
    permissionValue: number;
}
type OrganContractData = {
    cid: string;
    permissionsLength: bigint;
    entriesLength: bigint;
    entriesCount: bigint;
};
/** The data of an organ, deployed or still a draft. */
export interface OrganInput {
    /** Contract address, or a predicted address while it is a draft. */
    address?: string | null;
    /** Chain the organ lives on. */
    chainId?: string | null;
    /** Client used for reads. */
    publicClient?: PublicClient | null;
    /** Client that signs transactions. */
    walletClient?: WalletClient | null;
    /** Ether balance, in wei. */
    balance?: string | null;
    /** Reference to the off-chain metadata of the organ. */
    cid?: string | null;
    /** Addresses allowed to act on the organ, with their permission flags. */
    permissions?: OrganPermission[] | null;
    /** Members and documents registered in the organ. */
    entries?: Array<{
        index: string;
        address: string;
        cid: string;
        name?: string | null;
    }> | null;
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Whether the contract exists on chain. */
    isDeployed?: boolean | null;
    /** Display name. */
    name?: string | null;
    /** Free description. */
    description?: string | null;
    /** Organigram the organ belongs to. */
    organigramId?: string | null;
    /** Trusted forwarder relaying gasless transactions. */
    forwarder?: string | null;
}
/** An organ as plain JSON, to store or send it. */
export interface OrganJson {
    /** Contract address, or a predicted address while it is a draft. */
    address: string;
    /** Display name. */
    name: string;
    /** Whether the contract exists on chain. */
    isDeployed: boolean;
    /** Free description. */
    description: string;
    /** Reference to the off-chain metadata of the organ. */
    cid: string;
    /** Members and documents registered in the organ. */
    entries: OrganEntry[];
    /** Addresses allowed to act on the organ, with their permission flags. */
    permissions: OrganPermission[];
    /** Salt that determines the clone address. */
    salt?: string | null;
    /** Chain the organ lives on. */
    chainId: string;
    /** Organigram the organ belongs to. */
    organigramId: string;
    /** Ether balance, in wei. */
    balance: string;
}
/** The organ functions a proposal operation can call. */
export declare enum OrganFunctionName {
    /** Add entries. */
    addEntries = "addEntries",
    /** Remove entries. */
    removeEntries = "removeEntries",
    /** Replace one entry. */
    replaceEntry = "replaceEntry",
    /** Grant permissions to an address. */
    addPermission = "addPermission",
    /** Revoke the permissions of an address. */
    removePermission = "removePermission",
    /** Move permissions to another address. */
    replacePermission = "replacePermission",
    /** Send ether. */
    withdrawEther = "withdrawEther",
    /** Send ERC-20 tokens. */
    withdrawERC20 = "withdrawERC20",
    /** Send an ERC-721 token. */
    withdrawERC721 = "withdrawERC721"
}
/**
 * A group of the organization: a registry of members and documents, a list of permissions, and a balance of assets.
 *
 * @remarks Every change to an organ must come from an address holding the matching permission. In a governed organization, that address is a procedure, so that each change goes through a decision.
 */
export declare class Organ {
    /** ERC-165 interface identifier of organ contracts. */
    static INTERFACE: string;
    /** Display name. */
    name: string;
    /** Free description. */
    description: string;
    /** Contract address, or a predicted address while it is a draft. */
    address: string;
    /** Salt that determines the clone address. */
    salt: string | undefined;
    /** Chain the organ lives on. */
    chainId: string;
    /** Ether balance, in wei. */
    balance: string;
    /** Addresses allowed to act on the organ, with their permission flags. */
    permissions: OrganPermission[];
    /** Reference to the off-chain metadata of the organ. */
    cid: string;
    /** Members and documents registered in the organ. */
    entries: OrganEntry[];
    /** Client that signs transactions. */
    walletClient?: WalletClient;
    /** Client used for reads. */
    publicClient?: PublicClient;
    /** viem contract instance, once loaded. */
    contract?: OrganigramContract;
    /** Whether the contract exists on chain. */
    isDeployed: boolean;
    /** Organigram the organ belongs to. */
    organigramId: string;
    /** Trusted forwarder relaying gasless transactions. */
    forwarder: string;
    constructor({ address, chainId, publicClient, walletClient, balance, permissions, cid, entries, salt, isDeployed, name, description, organigramId, forwarder }: OrganInput);
    private getClients;
    /** Replace the reference to the off-chain metadata of the organ. */
    updateCid: (cid: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Add members or documents to the registry. */
    addEntries: (entries: OrganEntryInput[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Remove entries from the registry, by index. */
    removeEntries: (indexes: string[], options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Replace one entry of the registry. */
    replaceEntry: (index: number, entry: OrganEntryInput, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Grant permissions to an address. */
    addPermission: (permission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Revoke every permission of an address. */
    removePermission: (permission: string, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Move permissions from one address to another. */
    replacePermission: (oldPermissionAddress: string, newOrganPermission: OrganPermission, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Send ether held by the organ. */
    withdrawEther: (to: string, value: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Send ERC-20 tokens held by the organ. */
    withdrawERC20: (token: string, to: string, amount: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Send an ERC-721 token held by the organ. */
    withdrawERC721: (token: string, to: string, tokenId: string | number | bigint, options?: TransactionOptions) => Promise<OrganigramTransactionReceipt>;
    /** Read an organ from chain: its entries, permissions and metadata. */
    static load(address: string, clients: ContractClients, initialOrgan?: OrganInput): Promise<Organ>;
    /** Tell whether a contract is an organ. */
    static isOrgan(address: string, clients: ContractClients): Promise<boolean>;
    /** Read the ether balance of an organ, in wei. */
    static getBalance(address: string, clients: ContractClients): Promise<bigint>;
    /** Read the metadata reference and registry sizes of an organ. */
    static loadData(address: string, clients: ContractClients): Promise<OrganContractData>;
    /** Find the entry of an address in an organ, if it is a member. */
    static loadEntryForAccount(address: string, account: string, clients: ContractClients): Promise<OrganEntry | undefined>;
    /** Read the permission flags an address holds on an organ. */
    static checkAddressPermissions(organAddress: string, addressToCheck: string, clients: ContractClients): Promise<number>;
    /** Read one permission of an organ, by index. */
    static loadPermission(address: string, index: string, clients: ContractClients): Promise<OrganPermission>;
    /** Read every permission of an organ. */
    static loadPermissions(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganPermission[]>;
    /** Read one entry of an organ, by index. */
    static loadEntry(address: string, index: string, clients: ContractClients): Promise<OrganEntry>;
    /** Read every entry of an organ. */
    static loadEntries(address: string, clients: ContractClients, data?: OrganContractData): Promise<OrganEntry[]>;
    /**
     * Encode a call to an organ function, to use it as a proposal operation with `Procedure.createOperation()`.
     *
     * @example
     * ```ts
     * const call = await Organ.populateTransaction(organAddress, walletClient, 'addEntries', [
     *   { address: memberAddress }
     * ])
     * const operation = Procedure.createOperation(call)
     * ```
     */
    static populateTransaction(address: string, walletClient: WalletClient, functionName: OrganFunctionName | string, ...args: unknown[]): Promise<{
        to: string;
        data: string;
        functionName: string;
    }>;
    /** Read the whole organ again from chain. */
    reload(): Promise<Organ>;
    /** Read the entries again from chain. */
    reloadEntries(): Promise<Organ>;
    /** Read the permissions again from chain. */
    reloadPermissions(): Promise<Organ>;
    /** Read the metadata reference again from chain. */
    reloadData(): Promise<Organ>;
    /** Convert the organ into plain JSON. */
    toJson: () => OrganJson;
}
export {};
