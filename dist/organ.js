import OrganContractABI from '@organigram/protocol/abi/Organ.sol/Organ.json' with { type: 'json' };
import { decodeFunctionResult, encodeFunctionData, padHex, toHex, zeroAddress } from 'viem';
import { createRandom32BytesHexId, deployedAddresses, predictContractAddress } from './utils';
import { tryMulticall } from './multicall';
import { createContractWriteTransaction, getContractInstance, getWalletAddress } from './contracts';
export var OrganFunctionName;
(function (OrganFunctionName) {
    OrganFunctionName["addEntries"] = "addEntries";
    OrganFunctionName["removeEntries"] = "removeEntries";
    OrganFunctionName["replaceEntry"] = "replaceEntry";
    OrganFunctionName["addPermission"] = "addPermission";
    OrganFunctionName["removePermission"] = "removePermission";
    OrganFunctionName["replacePermission"] = "replacePermission";
    OrganFunctionName["withdrawEther"] = "withdrawEther";
    OrganFunctionName["withdrawERC20"] = "withdrawERC20";
    OrganFunctionName["withdrawERC721"] = "withdrawERC721";
})(OrganFunctionName || (OrganFunctionName = {}));
const formatPermissionValue = (value) => padHex((typeof value === 'string' && value.startsWith('0x')
    ? value
    : toHex(value)), { size: 2 });
const normalizeEntry = (entry) => ({
    addr: entry.address ?? zeroAddress,
    cid: entry.cid ?? ''
});
const normalizeLoadedOrganData = (data) => ({
    cid: data.cid ?? data[0],
    permissionsLength: BigInt(data.permissionsLength ?? data[1] ?? 0),
    entriesLength: BigInt(data.entriesLength ?? data[2] ?? 0),
    entriesCount: BigInt(data.entriesCount ?? data[3] ?? 0)
});
const normalizeLoadedPermission = (permission) => ({
    permissionAddress: permission.addr ?? permission.address ?? permission[0],
    permissionValue: typeof (permission.perms ?? permission[1]) === 'string'
        ? parseInt(permission.perms ?? permission[1], 16)
        : Number(permission.perms ?? permission[1])
});
const normalizeLoadedEntry = (entry, index) => ({
    index,
    address: entry.addr ?? entry.address ?? entry[0],
    cid: entry.cid ?? entry[1]
});
const normalizeOrganFunctionCall = async ({ functionName, args, walletClient }) => {
    switch (functionName) {
        case OrganFunctionName.addEntries:
            return {
                functionName: 'addEntries',
                args: [args[0].map(normalizeEntry)]
            };
        case OrganFunctionName.removeEntries:
            return {
                functionName: 'removeEntries',
                args: [args[0].map(index => BigInt(index))]
            };
        case OrganFunctionName.replaceEntry: {
            const [index, entry] = args;
            return {
                functionName: 'replaceEntry',
                args: [BigInt(index), entry.address ?? '', entry.cid ?? '']
            };
        }
        case OrganFunctionName.addPermission: {
            const [permissionAddress, permissionValue] = args;
            return {
                functionName: 'addPermission',
                args: [permissionAddress, formatPermissionValue(permissionValue)]
            };
        }
        case OrganFunctionName.removePermission:
            return {
                functionName: 'removePermission',
                args
            };
        case OrganFunctionName.replacePermission: {
            const [oldPermissionAddress, newPermissionAddress, permissionValue] = args;
            return {
                functionName: 'replacePermission',
                args: [
                    oldPermissionAddress,
                    newPermissionAddress,
                    formatPermissionValue(permissionValue)
                ]
            };
        }
        case OrganFunctionName.withdrawEther: {
            const [to, value] = args;
            return {
                functionName: 'transfer',
                args: [to, BigInt(value)]
            };
        }
        case OrganFunctionName.withdrawERC20: {
            const [token, maybeFromOrTo, maybeToOrAmount, maybeAmount] = args;
            const from = maybeAmount == null
                ? walletClient != null
                    ? await getWalletAddress(walletClient)
                    : undefined
                : maybeFromOrTo;
            const to = maybeAmount == null
                ? maybeFromOrTo
                : maybeToOrAmount;
            const amount = maybeAmount ?? maybeToOrAmount;
            if (from == null) {
                throw new Error('Wallet client not connected.');
            }
            return {
                functionName: 'transferCoins',
                args: [token, from, to, BigInt(amount)]
            };
        }
        case OrganFunctionName.withdrawERC721: {
            const [token, maybeFromOrTo, maybeToOrTokenId, maybeTokenId] = args;
            const from = maybeTokenId == null
                ? walletClient != null
                    ? await getWalletAddress(walletClient)
                    : undefined
                : maybeFromOrTo;
            const to = maybeTokenId == null
                ? maybeFromOrTo
                : maybeToOrTokenId;
            const tokenId = maybeTokenId ?? maybeToOrTokenId;
            if (from == null) {
                throw new Error('Wallet client not connected.');
            }
            return {
                functionName: 'transferCollectible',
                args: [token, from, to, BigInt(tokenId)]
            };
        }
        default:
            return { functionName: String(functionName), args };
    }
};
export class Organ {
    static INTERFACE = '0xf81b1307';
    name;
    description;
    address;
    salt;
    chainId;
    balance;
    permissions = [];
    cid;
    entries = [];
    walletClient;
    publicClient;
    contract;
    isDeployed;
    organigramId;
    forwarder;
    constructor({ address, chainId, publicClient, walletClient, balance, permissions, cid, entries, salt, isDeployed, name, description, organigramId, forwarder }) {
        this.name = name ?? 'Unnamed Organ';
        this.description = description ?? 'This organ does not have a description.';
        this.isDeployed = isDeployed ?? false;
        this.salt =
            salt || (this.isDeployed ? undefined : createRandom32BytesHexId());
        this.chainId = chainId ?? '11155111';
        this.address =
            address ??
                predictContractAddress({
                    type: 'Organ',
                    chainId: this.chainId,
                    salt: this.salt
                });
        this.organigramId = organigramId ?? 'default-organigram-id';
        this.forwarder =
            forwarder ?? deployedAddresses[this.chainId]?.MetaGasStation;
        this.balance = balance ?? '0';
        this.permissions = permissions ?? [];
        this.cid = cid ?? '';
        this.entries = entries ?? [];
        this.publicClient = publicClient ?? undefined;
        this.walletClient = walletClient ?? undefined;
        this.contract =
            this.publicClient != null
                ? getContractInstance({
                    address: this.address,
                    abi: OrganContractABI.abi,
                    publicClient: this.publicClient,
                    walletClient: this.walletClient
                })
                : undefined;
    }
    getClients() {
        if (this.publicClient == null) {
            throw new Error('Public client not connected.');
        }
        return {
            publicClient: this.publicClient,
            walletClient: this.walletClient
        };
    }
    getContract() {
        if (this.contract == null) {
            const clients = this.getClients();
            this.contract = getContractInstance({
                address: this.address,
                abi: OrganContractABI.abi,
                ...clients
            });
        }
        return this.contract;
    }
    updateCid = async (cid, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'updateCid',
            args: [cid],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Update CID of organ ${this.address} to ${cid}.`);
        return await tx.wait();
    };
    addEntries = async (entries, options) => {
        const normalizedEntries = entries
            .map(entry => {
            if ((entry.address == null || entry.address === '') &&
                (entry.cid == null || entry.cid === '')) {
                return undefined;
            }
            return normalizeEntry(entry);
        })
            .filter(entry => entry != null);
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'addEntries',
            args: [normalizedEntries],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Add ${normalizedEntries.length} entries to organ ${this.address}.`);
        return await tx.wait();
    };
    removeEntries = async (indexes, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'removeEntries',
            args: [indexes.map(index => BigInt(index))],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Remove ${indexes.length} entries from organ ${this.address}.`);
        return await tx.wait();
    };
    replaceEntry = async (index, entry, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'replaceEntry',
            args: [BigInt(index), entry.address ?? '', entry.cid ?? ''],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Replace entry ${index} of organ ${this.address}.`);
        return await tx.wait();
    };
    addPermission = async (permission, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'addPermission',
            args: [
                permission.permissionAddress,
                formatPermissionValue(permission.permissionValue)
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Add permission ${permission.permissionAddress} to organ ${this.address}.`);
        return await tx.wait();
    };
    removePermission = async (permission, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'removePermission',
            args: [permission],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Remove permission ${permission} from organ ${this.address}.`);
        return await tx.wait();
    };
    replacePermission = async (oldPermissionAddress, newOrganPermission, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'replacePermission',
            args: [
                oldPermissionAddress,
                newOrganPermission.permissionAddress,
                formatPermissionValue(newOrganPermission.permissionValue)
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Replace procedure ${oldPermissionAddress} with ${newOrganPermission.permissionAddress} in organ ${this.address}.`);
        return await tx.wait();
    };
    withdrawEther = async (to, value, options) => {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'transfer',
            args: [to, BigInt(value)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Withdraw ${value.toString()} wei from organ ${this.address} to ${to}.`);
        return await tx.wait();
    };
    withdrawERC20 = async (token, to, amount, options) => {
        if (this.walletClient == null) {
            throw new Error('Wallet client not connected.');
        }
        const from = await getWalletAddress(this.walletClient);
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'transferCoins',
            args: [token, from, to, BigInt(amount)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Withdraw ${amount.toString()} ERC20 units from organ ${this.address} to ${to}.`);
        return await tx.wait();
    };
    withdrawERC721 = async (token, to, tokenId, options) => {
        if (this.walletClient == null) {
            throw new Error('Wallet client not connected.');
        }
        const from = await getWalletAddress(this.walletClient);
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganContractABI.abi,
            functionName: 'transferCollectible',
            args: [token, from, to, BigInt(tokenId)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Withdraw ERC721 token ${tokenId.toString()} from organ ${this.address} to ${to}.`);
        return await tx.wait();
    };
    static async load(address, clients, initialOrgan) {
        if (!address) {
            throw new Error('Cannot load organ: No address provided.');
        }
        const chainId = initialOrgan?.chainId ?? String(await clients.publicClient.getChainId());
        const data = await Organ.loadData(address, clients);
        const balance = await clients.publicClient
            .getBalance({ address: address })
            .then((value) => value.toString())
            .catch(() => '0');
        const [permissions, entries] = await Promise.all([
            Organ.loadPermissions(address, clients, data),
            Organ.loadEntries(address, clients, data).catch((error) => {
                console.warn(error.message);
                return [];
            })
        ]);
        return new Organ({
            ...initialOrgan,
            address,
            chainId,
            publicClient: clients.publicClient,
            walletClient: clients.walletClient,
            balance,
            permissions,
            cid: data?.cid,
            entries,
            isDeployed: true
        });
    }
    static async isOrgan(address, clients) {
        const contract = getContractInstance({
            address,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        const isERC165 = await contract.read.supportsInterface(['0x01ffc9a7']);
        if (isERC165 === false)
            return false;
        return Boolean(await contract.read.supportsInterface([Organ.INTERFACE]));
    }
    static async getBalance(address, clients) {
        return await clients.publicClient.getBalance({
            address: address
        });
    }
    static async loadData(address, clients) {
        const contract = getContractInstance({
            address,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        return await contract.read
            .getOrgan()
            .then(data => normalizeLoadedOrganData(data))
            .catch((error) => {
            console.error(error.message);
            throw error;
        });
    }
    static async loadEntryForAccount(address, account, clients) {
        const contract = getContractInstance({
            address,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        const index = (await contract.read.getEntryIndexForAddress([account]));
        return await Organ.loadEntry(address, index.toString(), clients).catch(() => undefined);
    }
    static async checkAddressPermissions(organAddress, addressToCheck, clients) {
        const contract = getContractInstance({
            address: organAddress,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        const result = await contract.read.getPermissions([addressToCheck]).catch((error) => {
            console.error('Error', error.message);
            return '0x0000';
        });
        return typeof result === 'string' ? parseInt(result, 16) : Number(result);
    }
    static async loadPermission(address, index, clients) {
        const contract = getContractInstance({
            address,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        const permission = await contract.read
            .getPermission([BigInt(index)])
            .catch((error) => {
            console.error(error.message);
        });
        if (permission == null) {
            throw new Error('Unable to load permission.');
        }
        return normalizeLoadedPermission(permission);
    }
    static async loadPermissions(address, clients, data) {
        const organData = data ?? (await Organ.loadData(address, clients));
        const multicallPermissions = await tryMulticall(clients, Array.from({ length: Number(organData.permissionsLength) }).map((_, index) => ({
            target: address,
            callData: encodeFunctionData({
                abi: OrganContractABI.abi,
                functionName: 'getPermission',
                args: [BigInt(index)]
            }),
            decode: returnData => {
                const permission = decodeFunctionResult({
                    abi: OrganContractABI.abi,
                    functionName: 'getPermission',
                    data: returnData
                });
                return normalizeLoadedPermission(permission);
            }
        })));
        if (multicallPermissions != null) {
            return multicallPermissions.filter((permission) => permission != null);
        }
        return (await Promise.all(Array.from({ length: Number(organData.permissionsLength) }).map(async (_, index) => await Organ.loadPermission(address, index.toString(), clients).catch((error) => {
            console.warn('Error while loading permission in organ.', address, index.toString(), error.message);
            return null;
        })))).filter((permission) => permission != null);
    }
    static async loadEntry(address, index, clients) {
        const contract = getContractInstance({
            address,
            abi: OrganContractABI.abi,
            publicClient: clients.publicClient
        });
        const entry = (await contract.read.getEntry([BigInt(index)]));
        return normalizeLoadedEntry(entry, index);
    }
    static async loadEntries(address, clients, data) {
        const organData = data ?? (await Organ.loadData(address, clients));
        const indexes = Array.from({ length: Math.max(Number(organData.entriesLength) - 1, 0) }, (_, index) => index + 1);
        const multicallEntries = await tryMulticall(clients, indexes.map(index => ({
            target: address,
            callData: encodeFunctionData({
                abi: OrganContractABI.abi,
                functionName: 'getEntry',
                args: [BigInt(index)]
            }),
            decode: returnData => {
                const entry = decodeFunctionResult({
                    abi: OrganContractABI.abi,
                    functionName: 'getEntry',
                    data: returnData
                });
                return normalizeLoadedEntry(entry, index.toString());
            }
        })));
        if (multicallEntries != null) {
            return multicallEntries.filter((entry) => entry != null && entry.address !== zeroAddress);
        }
        const entries = await Promise.all(indexes.map(async (index) => {
            const entry = await Organ.loadEntry(address, index.toString(), clients).catch((error) => {
                console.warn('Error while loading entry in organ.', address, index.toString(), error.message);
                return null;
            });
            if (entry != null && entry.address !== zeroAddress) {
                return entry;
            }
            return null;
        }));
        return entries.filter((entry) => entry != null);
    }
    static async populateTransaction(address, walletClient, functionName, ...args) {
        const normalizedCall = await normalizeOrganFunctionCall({
            functionName,
            args,
            walletClient
        });
        return {
            to: address,
            functionName: normalizedCall.functionName,
            data: encodeFunctionData({
                abi: OrganContractABI.abi,
                functionName: normalizedCall.functionName,
                args: normalizedCall.args
            })
        };
    }
    async reload() {
        const { permissions, cid, entries } = await Organ.load(this.address, this.getClients());
        this.cid = cid;
        this.permissions = permissions;
        this.entries = entries;
        return this;
    }
    async reloadEntries() {
        this.entries = await Organ.loadEntries(this.address, this.getClients()).catch((error) => {
            console.warn("Error while reloading organ's entries", this.address, error.message);
            return this.entries;
        });
        return this;
    }
    async reloadPermissions() {
        this.permissions = await Organ.loadPermissions(this.address, this.getClients()).catch((error) => {
            console.warn("Error while reloading organ's permissions", this.address, error.message);
            return this.permissions;
        });
        return this;
    }
    async reloadData() {
        const data = await Organ.loadData(this.address, this.getClients());
        this.cid = data?.cid;
        return this;
    }
    toJson = () => JSON.parse(JSON.stringify({
        address: this.address,
        name: this.name,
        description: this.description,
        cid: this.cid,
        entries: this.entries,
        permissions: this.permissions,
        salt: this.salt,
        chainId: this.chainId ?? '',
        organigramId: this.organigramId ?? '',
        isDeployed: this.isDeployed,
        balance: this.balance.toString() + 'n'
    }));
}
