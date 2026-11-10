import { type PublicClient, type WalletClient } from 'viem';
import { Organ, OrganInput } from './organ';
import { Procedure, ProcedureInput, ProcedureType } from './procedure';
import { Organigram } from './organigram';
import { ProcedureTypeName } from './procedure/utils';
import { Asset, type AssetInput } from './asset';
import { type OrganigramTransaction, type OrganigramContract } from './contracts';
import { type DeployOrganigramResult } from './deploymentReferences';
/** An organ to deploy: the same shape as everywhere else, plus transaction options. */
export type DeployOrganInput = OrganInput & {
    options?: TransactionOptions;
};
/**
 * A procedure to deploy, plus transaction options and raw initialization
 * arguments. Its `typeName` must be a known procedure type.
 */
export type DeployProcedureInput = ProcedureInput & {
    typeName: ProcedureTypeName;
    options?: TransactionOptions;
    args?: unknown[];
};
/** Batch deployment input for a full organigram. */
export interface DeployOrganigramInput {
    /** Organs to deploy. */
    organs: DeployOrganInput[];
    /** Assets to deploy. */
    assets: AssetInput[];
    /** Procedures to deploy. */
    procedures: DeployProcedureInput[];
}
/** Options shared by every write. */
export interface TransactionOptions {
    /** Transaction nonce, to send several transactions at once. */
    nonce?: number;
    /** Called with the transaction as soon as it is sent, before it is mined. */
    onTransaction?: (tx: OrganigramTransaction, description: string) => void;
}
/**
 * Main SDK entry point used to deploy and hydrate Organigram Protocol objects.
 *
 * It keeps a public client, an optional wallet client, the registered
 * procedure types for the current chain, and small in-memory caches for
 * loaded organs, procedures, and assets.
 */
export declare class OrganigramClient {
    /** Address of the `OrganigramClient` contract. */
    address: string;
    /** Chain the client is connected to. */
    chainId: string;
    /** Procedure types registered on this chain. */
    procedureTypes: ProcedureType[];
    /** Organs loaded so far, kept in cache. */
    organs: Organ[];
    /** Procedures loaded so far, kept in cache. */
    procedures: Procedure[];
    /** Assets loaded so far, kept in cache. */
    assets: Asset[];
    /** Client used for every read. */
    publicClient: PublicClient;
    /** viem contract instance of the `OrganigramClient` contract. */
    contract: OrganigramContract;
    /** Client that signs transactions. Without it, the client is read-only. */
    walletClient?: WalletClient;
    constructor(input: {
        publicClient: PublicClient;
        address?: string;
        chainId?: string;
        procedureTypes?: ProcedureType[];
        contract?: OrganigramContract;
        walletClient?: WalletClient;
    });
    private getClients;
    /**
     * Deploy a fresh Organigram client contract together with its linked library.
     *
     * @param input - Clients used to broadcast deployments and wait for receipts.
     * @returns A ready-to-use SDK instance pointing at the newly deployed client.
     */
    static deployClient(input: {
        publicClient: PublicClient;
        walletClient: WalletClient;
    }): Promise<OrganigramClient>;
    /**
     * Load metadata for one deployed procedure implementation.
     *
     * @param input - Address and optional CID used to identify the procedure type.
     * @param publicClient - Read-only client used for interface checks.
     */
    static loadProcedureType({ addr, cid }: {
        addr: string;
        cid?: string;
    }, publicClient: PublicClient): Promise<ProcedureType>;
    /**
     * Read the procedure registry and resolve every supported procedure type.
     *
     * @param input - Optional client contract address and the public client used to query it.
     */
    static loadProcedureTypes({ address, publicClient }: {
        publicClient: PublicClient;
        address?: string;
    }): Promise<ProcedureType[]>;
    /**
     * Connect the SDK to an already deployed Organigram client contract.
     *
     * @param input - Address override plus the viem clients used for reads and writes.
     */
    static load(input: {
        address?: string;
        publicClient: PublicClient;
        walletClient?: WalletClient;
    }): Promise<OrganigramClient>;
    private mapWithConcurrencyLimit;
    /**
     * Infer the registered procedure type of a deployed procedure clone.
     *
     * @param procedureAddress - Address of the deployed procedure instance.
     */
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    /**
     * Load one deployed organ and keep it in the client cache.
     *
     * @param address - Organ contract address.
     * @param input - `fresh` reads the chain even when the organ is cached;
     * `initial` holds fallback metadata merged into the loaded organ.
     */
    loadOrgan(address: string, { fresh, initial }?: {
        fresh?: boolean;
        initial?: OrganInput;
    }): Promise<Organ>;
    /**
     * Load one deployed asset and keep it in the client cache.
     *
     * @param address - Asset contract address.
     * @param input - `fresh` reads the chain even when the asset is cached;
     * `initial` holds fallback metadata merged into the loaded asset.
     */
    loadAsset(address: string, { fresh, initial }?: {
        fresh?: boolean;
        initial?: Asset;
    }): Promise<Asset>;
    /**
     * Load one deployed procedure and keep it in the client cache.
     *
     * @param address - Procedure contract address.
     * @param input - `fresh` reads the chain even when the procedure is cached;
     * `initial` holds fallback metadata merged into the loaded procedure.
     */
    loadProcedure(address: string, { fresh, initial }?: {
        fresh?: boolean;
        initial?: ProcedureInput;
    }): Promise<Procedure>;
    /**
     * Deploy a single organ clone and hydrate the resulting SDK object.
     *
     * When no permissions are provided, the connected wallet is granted the full
     * admin bitmask by default so the organ remains operable after deployment.
     *
     * @param input - Optional organ metadata, permissions, entries, and transaction options.
     */
    deployOrgan(input?: DeployOrganInput): Promise<Organ>;
    /**
     * Deploy several organs in one batch transaction.
     *
     * @param deployOrgansInput - Organ definitions to deploy.
     */
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    /**
     * Deploy a single ERC-20 asset clone.
     *
     * @param input - Token name and symbol, supply in whole tokens before conversion
     * to wei, optional deterministic clone salt and transaction controls.
     * @returns The address of the deployed asset contract.
     */
    deployAsset({ name, symbol, initialSupply, salt, options }: {
        name: string;
        symbol: string;
        initialSupply?: number;
        salt?: string;
        options?: TransactionOptions;
    }): Promise<string>;
    /**
     * Deploy several assets in one batch transaction.
     *
     * @param assets - Assets to deploy.
     * @param options - Optional transaction controls.
     * @returns The deployed asset addresses in deployment order.
     */
    deployAssets(assets: AssetInput[], options?: TransactionOptions): Promise<string[]>;
    /**
     * Deploy a single procedure clone from one registered procedure type.
     *
     * @param input - Procedure type, role organs, optional metadata, and initialization args.
     */
    deployProcedure(input: DeployProcedureInput): Promise<Procedure>;
    /**
     * Deploy several procedures in one batch transaction.
     *
     * @param deployProceduresInput - Procedure definitions to deploy.
     */
    deployProcedures(deployProceduresInput: DeployProcedureInput[]): Promise<Procedure[]>;
    /**
     * Resolve what remains to deploy in an organigram and encode the
     * `deployOrganigram` arguments for it.
     *
     * @param input - Batch deployment input for the whole organigram.
     */
    private prepareOrganigramDeployment;
    /**
     * Estimate the gas a full organigram deployment would use, without a wallet.
     *
     * @param input - Batch deployment input for the whole organigram.
     * @param account - Address the deployment would be sent from.
     * @returns The estimated gas, or 0n when nothing remains to deploy.
     */
    estimateDeployOrganigramGas(input: DeployOrganigramInput, account: string): Promise<bigint>;
    /**
     * Deploy a full organigram, including its organs, assets, and procedures.
     *
     * @param input - Batch deployment input for the whole organigram.
     * @returns The deployed organ, asset, and procedure addresses, and the input
     * updated with them. Use `Organigram.deploy()` to get a loaded `Organigram`.
     */
    deployOrganigram(input: DeployOrganigramInput): Promise<DeployOrganigramResult>;
    /**
     * Attempt to load one deployed contract as an organ or procedure.
     *
     * @param address - Contract address to inspect.
     * @param input - `fresh` reads the chain even when the contract is cached.
     */
    loadContract(address: string, { fresh }?: {
        fresh?: boolean;
    }): Promise<Organ | Procedure | null>;
    /**
     * Load a heterogeneous list of deployed contract addresses into an organigram.
     *
     * @param contractAddresses - Addresses to resolve as organs, procedures, or assets.
     */
    loadContracts(contractAddresses: string[]): Promise<Organigram>;
    /**
     * Hydrate every deployed object referenced by an organigram definition.
     *
     * Undeployed placeholders are preserved as-is, while deployed organs,
     * procedures, and assets are refreshed from chain state.
     *
     * @param organigram - Organigram definition to hydrate.
     * @param input - `fresh: false` reuses the organs, procedures and assets already
     * in the client cache instead of reading them again.
     */
    loadOrganigram(organigram: Organigram, { fresh }?: {
        fresh?: boolean;
    }): Promise<Organigram>;
}
export default OrganigramClient;
