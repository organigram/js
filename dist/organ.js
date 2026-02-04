import { ethers } from 'ethers';
import OrganContractABI from '@organigram/protocol/artifacts/contracts/Organ.sol/Organ.json';
import { createRandom32BytesHexId, EMPTY_ADDRESS, predictContractAddress } from './utils';
export var OrganFunctionName;
(function (OrganFunctionName) {
    OrganFunctionName[OrganFunctionName["addEntries"] = 0] = "addEntries";
    OrganFunctionName[OrganFunctionName["removeEntries"] = 1] = "removeEntries";
    OrganFunctionName[OrganFunctionName["replaceEntry"] = 2] = "replaceEntry";
    OrganFunctionName[OrganFunctionName["addPermission"] = 3] = "addPermission";
    OrganFunctionName[OrganFunctionName["removePermission"] = 4] = "removePermission";
    OrganFunctionName[OrganFunctionName["replacePermission"] = 5] = "replacePermission";
    OrganFunctionName[OrganFunctionName["withdrawEther"] = 6] = "withdrawEther";
    OrganFunctionName[OrganFunctionName["withdrawERC20"] = 7] = "withdrawERC20";
    OrganFunctionName[OrganFunctionName["withdrawERC721"] = 8] = "withdrawERC721";
})(OrganFunctionName || (OrganFunctionName = {}));
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
    signer;
    provider;
    contract;
    isDeployed;
    isSource;
    isTarget;
    constructor({ address, chainId, signerOrProvider, balance, permissions, cid, entries, salt, isDeployed, name, description, isSource, isTarget }) {
        if (!address && !chainId) {
            throw new Error('Either address or chainId must be provided to organ constructor.');
        }
        this.name = name ?? 'Unnamed Organ';
        this.description = description ?? 'This organ does not have a description.';
        this.isDeployed = isDeployed ?? false;
        this.salt =
            (salt ?? this.isDeployed) ? undefined : createRandom32BytesHexId();
        this.chainId = chainId;
        this.address =
            address ??
                predictContractAddress({
                    type: 'Organ',
                    chainId: chainId,
                    salt: this.salt
                });
        this.balance = balance ?? 0n;
        this.permissions = permissions ?? [];
        this.cid = cid ?? '';
        this.entries = entries ?? [];
        if (signerOrProvider?.provider != null) {
            this.signer = signerOrProvider;
            this.provider = this.signer.provider;
        }
        else if (signerOrProvider instanceof ethers.JsonRpcProvider) {
            this.provider = signerOrProvider;
            signerOrProvider
                .getSigner()
                .then(signer => {
                this.signer = signer;
            })
                .catch((error) => {
                console.warn('Error while getting signer from provider.', error.message);
            });
        }
        this.contract = new ethers.Contract(this.address, OrganContractABI.abi, signerOrProvider);
        this.isSource = isSource ?? [];
        this.isTarget = isTarget ?? [];
    }
    updateCid = async (cid, options) => {
        const tx = await this.contract.updateCid(cid, { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Update CID of organ ${this.address} to ${cid}.`);
        }
        return await tx.wait();
    };
    addEntries = async (entries, options) => {
        const _entries = entries
            .map(e => {
            if ((e.address == null || e.address === '') &&
                (e.cid == null || e.cid === '')) {
                return undefined;
            }
            return {
                addr: e.address ?? EMPTY_ADDRESS,
                cid: e.cid
            };
        })
            .filter(i => i != null);
        const tx = await this.contract.addEntries(_entries, {
            ...(options?.nonce != null ? { nonce: options.nonce } : {})
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Add ${_entries.length} entries to organ ${this.address}.`);
        }
        return await tx.wait();
    };
    removeEntries = async (indexes, options) => {
        const tx = await this.contract.removeEntries(indexes, {
            ...(options?.nonce != null ? { nonce: options.nonce } : {})
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Remove ${indexes.length} entries from organ ${this.address}.`);
        }
        return await tx.wait();
    };
    replaceEntry = async (index, entry, options) => {
        const tx = await this.contract.replaceEntry(index, entry.address ?? '', entry.cid ?? '', { ...(options?.nonce != null ? { nonce: options.nonce } : {}) });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Replace entry ${index} of organ ${this.address}.`);
        }
        return await tx.wait();
    };
    addPermission = async (permission, options) => {
        const permissions = `0x${permission.permissionValue
            .toString(16)
            .padStart(4, '0')}`;
        const tx = await this.contract.addPermission(permission.permissionAddress, permissions, { ...(options?.nonce != null ? { nonce: options.nonce } : {}) });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Add permission ${permission.permissionAddress} to organ ${this.address}.`);
        }
        return await tx.wait();
    };
    removePermission = async (permission, options) => {
        const tx = await this.contract.removePermission(permission, {
            ...(options?.nonce != null ? { nonce: options.nonce } : {})
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Remove permission ${permission} from organ ${this.address}.`);
        }
        return await tx.wait();
    };
    replacePermission = async (oldPermissionAddress, newOrganPermission, options) => {
        const permissions = `0x${newOrganPermission.permissionValue
            .toString(16)
            .padStart(4, '0')}`;
        const tx = await this.contract.replacePermission(oldPermissionAddress, newOrganPermission.permissionAddress, permissions, { ...(options?.nonce != null ? { nonce: options.nonce } : {}) });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Replace procedure ${oldPermissionAddress} with ${newOrganPermission.permissionAddress} in organ ${this.address}.`);
        }
        return await tx.wait();
    };
    static async load(address, signerOrProvider) {
        const provider = signerOrProvider.provider ?? signerOrProvider;
        const network = signerOrProvider.provider != null ? await provider?.getNetwork() : null;
        const chainId = network?.chainId.toString() ?? '1';
        if (chainId == null) {
            throw new Error('No chainId found.');
        }
        const data = await Organ.loadData(address, signerOrProvider);
        const balance = (await provider?.getBalance(address).catch(() => 0n)) ?? 0n;
        const permissions = await Organ.loadPermissions(address, signerOrProvider);
        const entries = await Organ.loadEntries(address, signerOrProvider).catch((error) => {
            console.warn(error.message);
            return [];
        });
        return new Organ({
            address,
            chainId,
            signerOrProvider,
            balance,
            permissions,
            cid: data?.cid,
            entries,
            isDeployed: true
        });
    }
    static async isOrgan(address, signerOrProvider) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signerOrProvider);
        const isERC165 = await contract.supportsInterface('0x01ffc9a7');
        if (isERC165 === false)
            return false;
        return await contract.supportsInterface(Organ.INTERFACE);
    }
    static async getBalance(address, signerOrProvider) {
        const provider = signerOrProvider.provider ?? signerOrProvider;
        const balance = provider?.getBalance(address);
        if (balance == null)
            return 0n;
        return await balance;
    }
    static async loadData(address, signerOrProvider) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signerOrProvider);
        return await contract.getOrgan().catch((e) => {
            console.error(e.message);
        });
    }
    static async loadEntryForAccount(address, account, signerOrProvider) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signerOrProvider);
        const index = await contract.getEntryIndexForAddress(account, {});
        return await Organ.loadEntry(address, index, signerOrProvider).catch(() => undefined);
    }
    static async checkAddressPermissions(organAddress, addressToCheck, signerOrProvider) {
        const contract = new ethers.Contract(organAddress, OrganContractABI.abi, signerOrProvider);
        return await contract
            .getPermissions(addressToCheck)
            .catch((e) => {
            console.error('Error', e.message);
        })
            .then((res) => typeof res.perms === 'string' ? parseInt(res.perms, 16) : res.perms);
    }
    static async loadPermission(address, index, signerOrProvider) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signerOrProvider);
        const permission = await contract.getPermission(index).catch((e) => {
            console.error(e.message);
        });
        if (permission == null) {
            throw new Error('Unable to load permission.');
        }
        return {
            permissionAddress: permission.addr,
            permissionValue: typeof permission.perms === 'string'
                ? parseInt(permission.perms, 16)
                : permission.perms
        };
    }
    static async loadPermissions(address, signerOrProvider) {
        const data = await Organ.loadData(address, signerOrProvider);
        const permissions = [];
        for (let i = 0n; i < data.permissionsLength; i++) {
            const permission = await Organ.loadPermission(address, i.toString(), signerOrProvider).catch((error) => {
                console.warn('Error while loading permission in organ ', address, i.toString(), error.message);
                return null;
            });
            if (permission != null)
                permissions.push(permission);
        }
        return permissions;
    }
    static async loadEntry(address, index, signerOrProvider) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signerOrProvider);
        const entry = await contract.getEntry(index);
        return { index, address: entry.addr, cid: entry.cid };
    }
    static async loadEntries(address, signerOrProvider) {
        const length = (await Organ.loadData(address, signerOrProvider))?.entriesLength ?? 0n;
        const entries = await Promise.all(Array.from({ length: parseInt(length.toString()) }).map(async (_, i) => {
            if (i !== 0) {
                const entry = await Organ.loadEntry(address, i.toString(), signerOrProvider).catch((error) => {
                    console.warn('Error while loading entry in organ.', address, i.toString(), error.message);
                    return null;
                });
                if (entry != null && entry.address !== EMPTY_ADDRESS) {
                    return entry;
                }
            }
        })).then(e => e.filter(i => i != null));
        return entries;
    }
    static async populateTransaction(address, signer, functionName, ...args) {
        const contract = new ethers.Contract(address, OrganContractABI.abi, signer);
        return await contract[functionName.toString()].populateTransaction(...args);
    }
    async reload() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const { permissions, cid, entries } = await Organ.load(this.address, signerOrProvider);
        this.cid = cid;
        this.permissions = permissions;
        this.entries = entries;
        return this;
    }
    async reloadEntries() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        this.entries = await Organ.loadEntries(this.address, signerOrProvider).catch(error => {
            console.warn("Error while reloading organ's entries", this.address, error.message);
            return this.entries;
        });
        return this;
    }
    async reloadPermissions() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        this.permissions = await Organ.loadPermissions(this.address, signerOrProvider).catch(error => {
            console.warn("Error while reloading organ's permissions", this.address, error.message);
            return this.permissions;
        });
        return this;
    }
    async reloadData() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const data = await Organ.loadData(this.address, signerOrProvider);
        this.cid = data?.cid;
        return this;
    }
}
export default Organ;
