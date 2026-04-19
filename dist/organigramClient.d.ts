import { type PublicClient, type WalletClient } from 'viem';
import { Organ, OrganEntry, OrganInput, OrganPermission } from './organ';
import { Procedure, ProcedureInput, ProcedureType } from './procedure';
import { Organigram } from './organigram';
import { ProcedureTypeName } from './procedure/utils';
import { Asset } from './asset';
import { type OrganigramTransaction } from './contracts';
/**
 * Input used to deploy one organ through an {@link OrganigramClient}.
 */
export interface DeployOrganInput {
    cid?: string;
    permissions?: OrganPermission[];
    entries?: OrganEntry[];
    salt?: string | null;
    options?: TransactionOptions;
}
/**
 * Input used to deploy one procedure instance from a registered procedure type.
 */
export interface DeployProceduresInput {
    typeName: ProcedureTypeName;
    chainId?: string | null;
    cid?: string | null;
    proposers?: string | null;
    moderators?: string | null;
    deciders: string;
    withModeration?: boolean | null;
    forwarder?: string | null;
    salt?: string | null;
    options?: TransactionOptions;
    data?: string;
    args?: unknown[];
}
/**
 * Batch deployment input for a full organigram.
 */
export interface DeployOrganigramInput {
    organs: DeployOrganInput[];
    assets: DeployAssetInput[];
    procedures: DeployProceduresInput[];
}
/**
 * Input used to deploy one ERC-20 asset contract.
 */
export interface DeployAssetInput {
    name: string;
    symbol: string;
    initialSupply?: number | null;
    salt?: string | null;
}
/**
 * Optional transaction-level controls shared by write operations.
 */
export interface TransactionOptions {
    nonce?: number;
    customData?: {
        index?: number;
    };
    onTransaction?: (tx: OrganigramTransaction, description: string) => void;
}
/**
 * In-memory representation of a CID-backed file managed by the client.
 */
export interface File {
    cid: string;
    data: unknown;
}
/**
 * Main SDK entry point used to deploy and hydrate Organigram protocol objects.
 *
 * It keeps a public client, an optional wallet client, the registered
 * procedure types for the current chain, and small in-memory caches for
 * loaded organs, procedures, and assets.
 */
export declare class OrganigramClient {
    address: string;
    chainId: string;
    procedureTypes: ProcedureType[];
    organs: Organ[];
    procedures: Procedure[];
    assets: Asset[];
    cids: File[];
    publicClient: PublicClient;
    contract: any;
    walletClient?: WalletClient;
    constructor(input: {
        publicClient: PublicClient;
        address?: string;
        chainId?: string;
        procedureTypes?: ProcedureType[];
        contract?: any;
        walletClient?: WalletClient;
    });
    private getClients;
    /**
     * Deploy a fresh Organigram client contract together with its linked library.
     *
     * @param input Clients used to broadcast deployments and wait for receipts.
     * @returns A ready-to-use SDK instance pointing at the newly deployed client.
     */
    static deployClient(input: {
        publicClient: PublicClient;
        walletClient: WalletClient;
    }): Promise<OrganigramClient>;
    /**
     * Load metadata for one deployed procedure implementation.
     *
     * @param input Address and optional CID used to identify the procedure type.
     * @param publicClient Read-only client used for interface checks.
     */
    static loadProcedureType({ addr, cid }: {
        addr: string;
        cid?: string;
    }, publicClient: PublicClient): Promise<ProcedureType>;
    /**
     * Read the procedure registry and resolve every supported procedure type.
     *
     * @param input Optional client contract address and the public client used to query it.
     */
    static loadProcedureTypes({ address, publicClient }: {
        publicClient: PublicClient;
        address?: string;
    }): Promise<ProcedureType[]>;
    /**
     * Connect the SDK to an already deployed Organigram client contract.
     *
     * @param input Address override plus the viem clients used for reads and writes.
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
     * @param procedureAddress Address of the deployed procedure instance.
     */
    getProcedureType(procedureAddress: string): Promise<ProcedureType | null>;
    /**
     * Load one deployed organ and memoize it in the client cache.
     *
     * @param address Organ contract address.
     * @param cached Whether an already hydrated organ can be reused from memory.
     * @param initialOrgan Optional fallback metadata merged into the loaded organ.
     */
    getDeployedOrgan(address: string, cached?: boolean, initialOrgan?: OrganInput): Promise<Organ>;
    /**
     * Load one deployed asset and memoize it in the client cache.
     *
     * @param address Asset contract address.
     * @param cached Whether an already hydrated asset can be reused from memory.
     * @param initialAsset Optional fallback metadata merged into the loaded asset.
     */
    getDeployedAsset(address: string, cached?: boolean, initialAsset?: Asset): Promise<Asset>;
    /**
     * Load one deployed procedure and memoize it in the client cache.
     *
     * @param address Procedure contract address.
     * @param cached Whether an already hydrated procedure can be reused from memory.
     * @param initialProcedure Optional fallback metadata merged into the loaded procedure.
     */
    getDeployedProcedure(address: string, cached?: boolean, initialProcedure?: ProcedureInput): Promise<Procedure>;
    /**
     * Deploy a single organ clone and hydrate the resulting SDK object.
     *
     * When no permissions are provided, the connected wallet is granted the full
     * admin bitmask by default so the organ remains operable after deployment.
     *
     * @param input Optional organ metadata, permissions, entries, and transaction options.
     */
    deployOrgan(input?: DeployOrganInput): Promise<Organ>;
    /**
     * Deploy several organs in one batch transaction.
     *
     * @param deployOrgansInput Organ definitions to deploy.
     */
    deployOrgans(deployOrgansInput: DeployOrganInput[]): Promise<Organ[]>;
    /**
     * Deploy a single ERC-20 asset clone.
     *
     * @param name Token name exposed by the deployed contract.
     * @param symbol Token symbol exposed by the deployed contract.
     * @param initialSupply Human-readable token supply before conversion to wei.
     * @param salt Optional deterministic clone salt.
     * @param options Optional transaction controls.
     * @returns The address of the deployed asset contract.
     */
    deployAsset(name: string, symbol: string, initialSupply: number, salt?: string, options?: TransactionOptions): Promise<string>;
    /**
     * Deploy several assets in one batch transaction.
     *
     * @param assets Assets to deploy.
     * @param options Optional transaction controls.
     * @returns The deployed asset addresses in deployment order.
     */
    deployAssets(assets: DeployAssetInput[], options?: TransactionOptions): Promise<string[]>;
    /**
     * Deploy a single procedure clone from one registered procedure type.
     *
     * @param input Procedure type, role organs, optional metadata, and initialization args.
     */
    deployProcedure(input: DeployProceduresInput): Promise<Procedure>;
    /**
     * Deploy several procedures in one batch transaction.
     *
     * @param deployProceduresInput Procedure definitions to deploy.
     */
    deployProcedures(deployProceduresInput: DeployProceduresInput[]): Promise<Procedure[]>;
    /**
     * Deploy a full organigram, including its organs, assets, and procedures.
     *
     * @param input Batch deployment input for the whole organigram.
     * @returns The deployed organ, asset, and procedure addresses.
     */
    deployOrganigram(input: DeployOrganigramInput): Promise<readonly string[]>;
    /**
     * Attempt to load one deployed contract as an organ or procedure.
     *
     * @param address Contract address to inspect.
     * @param cached Whether cached instances may be reused.
     */
    loadContract(address: string, cached?: boolean): Promise<Organ | Procedure | null>;
    /**
     * Load a heterogeneous list of deployed contract addresses into an organigram.
     *
     * @param contractAddresses Addresses to resolve as organs, procedures, or assets.
     */
    loadContracts(contractAddresses: string[]): Promise<Organigram>;
    /**
     * Hydrate every deployed object referenced by an organigram definition.
     *
     * Undeployed placeholders are preserved as-is, while deployed organs,
     * procedures, and assets are refreshed from chain state.
     *
     * @param organigram Organigram definition to hydrate.
     * @param cached Whether previously cached instances may be reused.
     */
    loadOrganigram(organigram: Organigram, cached?: boolean): Promise<Organigram>;
}
export default OrganigramClient;
