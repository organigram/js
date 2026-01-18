"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organ = exports.OrganFunctionName = void 0;
const ethers_1 = require("ethers");
const Organ_json_1 = __importDefault(require("@organigram/protocol/abi/Organ.json"));
const utils_1 = require("./utils");
var OrganFunctionName;
(function (OrganFunctionName) {
    OrganFunctionName[OrganFunctionName["addEntries"] = 0] = "addEntries";
    OrganFunctionName[OrganFunctionName["removeEntries"] = 1] = "removeEntries";
    OrganFunctionName[OrganFunctionName["replaceEntry"] = 2] = "replaceEntry";
    OrganFunctionName[OrganFunctionName["addProcedure"] = 3] = "addProcedure";
    OrganFunctionName[OrganFunctionName["removeProcedure"] = 4] = "removeProcedure";
    OrganFunctionName[OrganFunctionName["replaceProcedure"] = 5] = "replaceProcedure";
    OrganFunctionName[OrganFunctionName["withdrawEther"] = 6] = "withdrawEther";
    OrganFunctionName[OrganFunctionName["withdrawERC20"] = 7] = "withdrawERC20";
    OrganFunctionName[OrganFunctionName["withdrawERC721"] = 8] = "withdrawERC721";
})(OrganFunctionName || (exports.OrganFunctionName = OrganFunctionName = {}));
class Organ {
    static INTERFACE = '0xf81b1307';
    address;
    chainId = '1';
    balance;
    procedures = [];
    cid;
    entries = [];
    signer;
    provider;
    contract;
    constructor({ address, chainId, signerOrProvider, balance, procedures, cid, entries }) {
        this.address = address;
        this.chainId = chainId;
        this.balance = balance;
        this.procedures = procedures;
        this.cid = cid;
        this.entries = entries;
        if (signerOrProvider.provider != null) {
            this.signer = signerOrProvider;
            this.provider = this.signer.provider;
        }
        else if (signerOrProvider instanceof ethers_1.ethers.JsonRpcProvider) {
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
        this.contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
    }
    updateCid = async (cid, options) => {
        const tx = await this.contract.updateCid(cid, { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Update CID of organ ${this.address} to ${cid}.`);
        }
        return tx.wait();
    };
    addEntries = async (entries, options) => {
        const _entries = entries
            .map(e => {
            if ((e.address == null || e.address === '') &&
                (e.cid == null || e.cid === '')) {
                return undefined;
            }
            return {
                addr: e.address ?? utils_1.EMPTY_ADDRESS,
                cid: e.cid
            };
        })
            .filter(i => i != null);
        const tx = await this.contract.addEntries(_entries, {
            nonce: options?.nonce
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Add ${_entries.length} entries to organ ${this.address}.`);
        }
        return tx.wait();
    };
    removeEntries = async (indexes, options) => {
        const tx = await this.contract.removeEntries(indexes, { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Remove ${indexes.length} entries from organ ${this.address}.`);
        }
        return tx.wait();
    };
    replaceEntry = async (index, entry, options) => {
        const tx = await this.contract.replaceEntry(index, entry.address ?? '', entry.cid ?? '', { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Replace entry ${index} of organ ${this.address}.`);
        }
        return tx.wait();
    };
    addProcedure = async (procedure, options) => {
        const permissions = `0x${procedure.permissions
            .toString(16)
            .padStart(4, '0')}`;
        const tx = await this.contract.addProcedure(procedure.address, permissions, { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Add procedure ${procedure.address} to organ ${this.address}.`);
        }
        return tx.wait();
    };
    removeProcedure = async (procedure, options) => {
        const tx = await this.contract.removeProcedure(procedure, {
            nonce: options?.nonce
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Remove procedure ${procedure} from organ ${this.address}.`);
        }
        return tx.wait();
    };
    replaceProcedure = async (oldProcedure, newOrganProcedure, options) => {
        const permissions = `0x${newOrganProcedure.permissions
            .toString(16)
            .padStart(4, '0')}`;
        const tx = await this.contract.replaceProcedure(oldProcedure, newOrganProcedure.address, permissions, { nonce: options?.nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Replace procedure ${oldProcedure} with ${newOrganProcedure.address} in organ ${this.address}.`);
        }
        return tx.wait();
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
        const procedures = await Organ.loadProcedures(address, signerOrProvider);
        const entries = await Organ.loadEntries(address, signerOrProvider).catch((error) => {
            console.warn(error.message);
            return [];
        });
        return new Organ({
            address,
            chainId,
            signerOrProvider,
            balance,
            procedures,
            cid: data?.cid,
            entries
        });
    }
    static async isOrgan(address, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
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
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
        return await contract.getOrgan().catch((e) => {
            console.error(e.message);
        });
    }
    static async loadEntryForAccount(address, account, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
        const index = await contract.getEntryIndexForAddress(account, {});
        return await Organ.loadEntry(address, index, signerOrProvider).catch(() => undefined);
    }
    static async loadPermissions(address, procedure, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
        return await contract
            .getPermissions(procedure)
            .catch((e) => {
            console.error('Error', e.message);
        })
            .then((res) => typeof res.perms === 'string' ? parseInt(res.perms, 16) : res.perms);
    }
    static async loadProcedure(address, index, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
        const procedure = await contract.getProcedure(index).catch((e) => {
            console.error(e.message);
        });
        if (procedure == null) {
            throw new Error('Unable to load procedure.');
        }
        return {
            address: procedure.addr,
            permissions: typeof procedure.perms === 'string'
                ? parseInt(procedure.perms, 16)
                : procedure.perms
        };
    }
    static async loadProcedures(address, signerOrProvider) {
        const data = await Organ.loadData(address, signerOrProvider);
        const procedures = [];
        for (let i = 0n; i < data.proceduresLength; i++) {
            const procedure = await Organ.loadProcedure(address, i.toString(), signerOrProvider).catch((error) => {
                console.warn('Error while loading procedure in organ.', address, i.toString(), error.message);
                return null;
            });
            if (procedure != null)
                procedures.push(procedure);
        }
        return procedures;
    }
    static async loadEntry(address, index, signerOrProvider) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signerOrProvider);
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
                if (entry != null && entry.address !== utils_1.EMPTY_ADDRESS) {
                    return entry;
                }
            }
        })).then(e => e.filter(i => i != null));
        return entries;
    }
    static async populateTransaction(address, signer, functionName, ...args) {
        const contract = new ethers_1.ethers.Contract(address, Organ_json_1.default, signer);
        return await contract[functionName.toString()].populateTransaction(...args);
    }
    async reload() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const { procedures, cid, entries } = await Organ.load(this.address, signerOrProvider);
        this.cid = cid;
        this.procedures = procedures;
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
    async reloadProcedures() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        this.procedures = await Organ.loadProcedures(this.address, signerOrProvider).catch(error => {
            console.warn("Error while reloading organ's procedures", this.address, error.message);
            return this.procedures;
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
exports.Organ = Organ;
exports.default = Organ;
