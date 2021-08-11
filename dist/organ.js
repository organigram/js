"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsSet = exports.PERMISSIONS = exports.Organ = exports.ORGAN_CONTRACT_SIGNATURES = void 0;
const web3_1 = __importDefault(require("web3"));
const it_all_1 = __importDefault(require("it-all"));
const concat_1 = __importDefault(require("uint8arrays/concat"));
const Organ_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Organ.json"));
const web3_2 = require("./web3");
const ipfs_1 = require("./ipfs");
exports.ORGAN_CONTRACT_SIGNATURES = ((_b = (_a = Organ_json_1.default.ast.nodes
    .find(n => n.name === '')) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.map(n => (n === null || n === void 0 ? void 0 : n.functionSelector) || '').filter(i => i !== '')) || [];
class Organ {
    constructor({ address, network, balance, procedures, metadata, entries }) {
        this.address = '';
        this.network = 'mainnet';
        this.balance = 'n/a';
        this.procedures = [];
        this.entries = [];
        this.updateMetadata = (cid = ipfs_1.CID.parse('QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH')) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error('Wrong CID.');
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .updateMetadata({ ipfsHash, hashFunction, hashSize })
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while updating metadata.', this.address, error.message);
                    return false;
                }));
        });
        this.addEntries = (entries) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const _entries = entries.map(e => {
                let multihash = e.cid && ipfs_1.cidToMultihash(e.cid);
                if (!multihash)
                    throw new Error(`Wrong IPFS Content ID '${e.cid}' for entry.`);
                const { ipfsHash, hashFunction, hashSize } = multihash;
                return { addr: e.address, doc: { ipfsHash, hashFunction, hashSize } };
            });
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .addEntries(_entries)
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while adding entries to organ.', this.address, error.message);
                    return false;
                }));
        });
        this.removeEntries = (indexes) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .removeEntries(indexes)
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while removing entries in organ.', this.address, error.message);
                    return false;
                }));
        });
        this.replaceEntry = (index, entry) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const multihash = entry.cid && ipfs_1.cidToMultihash(entry.cid);
            if (!multihash)
                throw new Error('Wrong CID.');
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .replaceEntry(index, entry.address, {
                    ipfsHash,
                    hashFunction,
                    hashSize
                })
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while replacing entry in organ.', this.address, error.message);
                    return false;
                }));
        });
        this.addProcedure = (procedure) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            const permissions = `0x${(procedure.permissions || 0)
                .toString(16)
                .padStart(4, '0')}`;
            return (from &&
                contract.methods
                    .addProcedure(procedure.address, permissions)
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while adding procedures in organ.', this.address, error.message);
                    return false;
                }));
        });
        this.removeProcedure = (procedure) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .removeProcedure(procedure)
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while removing procedure in organ.', this.address, error.message);
                    return false;
                }));
        });
        this.replaceProcedure = (oldProcedure, newOrganProcedure) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, this.address);
            const permissions = `0x${(newOrganProcedure.permissions || 0)
                .toString(16)
                .padStart(4, '0')}`;
            const from = yield web3_2.getAccount();
            return (from &&
                contract.methods
                    .replaceProcedure(oldProcedure, newOrganProcedure.address, permissions)
                    .send({ from })
                    .then(() => true)
                    .catch((error) => {
                    console.error('Error while replacing procedure in organ.', this.address, error.message);
                    return false;
                }));
        });
        this.address = address;
        this.network = network;
        this.balance = balance;
        this.procedures = procedures;
        this.metadata = metadata;
        this.entries = entries;
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const network = yield web3_2.getNetwork();
            if (!network)
                throw new Error('Not connected to a valid network.');
            const isOrgan = yield Organ.isOrgan(address).catch(() => false);
            const balance = yield Organ.getBalance(address).catch(() => 'n/a');
            const organData = yield Organ.loadData(address);
            const metadata = { cid: organData === null || organData === void 0 ? void 0 : organData.metadata };
            const procedures = yield Organ.loadProcedures(address).catch(error => {
                console.warn("Error while loading organ's procedures", address, error.message);
                return [];
            });
            const entries = yield Organ.loadEntries(address).catch(error => {
                console.warn("Error while loading organ's entries", address, error.message);
                return [];
            });
            return new Organ({
                address,
                network,
                balance,
                procedures,
                metadata,
                entries
            });
        });
    }
    static isOrgan(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            const isERC165 = yield contract.methods
                .supportsInterface('0x01ffc9a7')
                .call()
                .catch(() => false);
            if (!isERC165)
                return false;
            const isOrgan = yield contract.methods
                .supportsInterface(Organ.INTERFACE)
                .call()
                .catch(() => false);
            return isOrgan;
        });
    }
    static getBalance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const balance = yield web3_2.web3.eth.getBalance(address);
            return `${balance}`;
        });
    }
    static loadData(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            const data = yield contract.methods.getOrgan().call();
            const cid = ipfs_1.multihashToCid(data.metadata);
            return {
                metadata: cid,
                proceduresLength: data === null || data === void 0 ? void 0 : data.proceduresLength,
                entriesLength: data === null || data === void 0 ? void 0 : data.entriesLength,
                entriesCount: data === null || data === void 0 ? void 0 : data.entriesCount
            };
        });
    }
    static loadEntryForAccount(address, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            const index = yield contract.methods.getEntryIndexForAddress(account).call();
            return Organ.loadEntry(address, index);
        });
    }
    static loadPermissions(address, procedure) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            return contract.methods
                .getPermissions(procedure)
                .call()
                .catch((e) => console.error('Error', e.message))
                .then(({ perms }) => perms);
        });
    }
    static loadProcedure(address, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            return contract.methods
                .getProcedure(index)
                .call()
                .catch((e) => console.error('Error', e.message))
                .then((data) => data && {
                address: data.addr,
                permissions: data.perms
            });
        });
    }
    static loadProcedures(address) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Organ.loadData(address);
            const length = web3_1.default.utils.toBN(data.proceduresLength);
            let procedures = [];
            const iGenerator = function* () {
                let i = web3_1.default.utils.toBN('0');
                while (i.lt(length)) {
                    yield i;
                    i = i.addn(1);
                }
            };
            try {
                for (var _b = __asyncValues(iGenerator()), _c; _c = yield _b.next(), !_c.done;) {
                    let i = _c.value;
                    const key = i.toString();
                    const procedure = yield Organ.loadProcedure(address, key).catch((error) => {
                        console.warn('Error while loading procedure in organ.', address, key, error.message);
                        return null;
                    });
                    if (procedure)
                        procedures.push(procedure);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return procedures;
        });
    }
    static loadEntry(address, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            const ipfs = yield ipfs_1.ipfsNode;
            if (!ipfs) {
                console.info('IPFS was not started. Starting IPFS.');
                yield ipfs.start().catch((e) => console.warn(e.message));
            }
            return contract.methods
                .getEntry(index)
                .call()
                .then(({ addr, doc }) => __awaiter(this, void 0, void 0, function* () {
                if (addr === web3_2.EMPTY_ADDRESS &&
                    (!parseInt(doc.hashFunction, 16) || !parseInt(doc.hashSize)))
                    return null;
                let entry = {
                    index,
                    address: addr,
                    cid: ipfs_1.multihashToCid(doc)
                };
                if (entry.cid) {
                    try {
                        entry.data = concat_1.default(yield it_all_1.default(ipfs.cat(entry.cid)));
                    }
                    catch (error) {
                        console.warn('Error while loading data hash for entry.', address, index, error.message);
                    }
                }
                return entry;
            }));
        });
    }
    static loadEntries(address) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const length = web3_1.default.utils.toBN((yield Organ.loadData(address)).entriesLength);
            let entries = [];
            const iGenerator = function* () {
                let i = web3_1.default.utils.toBN('1');
                while (i.lt(length)) {
                    yield i;
                    i = i.addn(1);
                }
            };
            try {
                for (var _b = __asyncValues(iGenerator()), _c; _c = yield _b.next(), !_c.done;) {
                    let index = _c.value;
                    const key = index.toString();
                    const entry = yield Organ.loadEntry(address, key).catch((error) => {
                        console.warn('Error while loading entry in organ.', address, key, error.message);
                        return null;
                    });
                    if (entry)
                        entries.push(entry);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return entries;
        });
    }
    static generateEncodedABI(address, functionName, ...args) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_2.web3.eth.Contract(Organ_json_1.default.abi, address);
            return (_d = (_c = (_b = (_a = contract === null || contract === void 0 ? void 0 : contract.methods) === null || _a === void 0 ? void 0 : _a[functionName]) === null || _b === void 0 ? void 0 : _b.call(_a, ...args)) === null || _c === void 0 ? void 0 : _c.encodeABI) === null || _d === void 0 ? void 0 : _d.call(_c);
        });
    }
    reload() {
        return __awaiter(this, void 0, void 0, function* () {
            const { procedures, metadata, entries } = yield Organ.load(this.address);
            this.metadata = metadata;
            this.procedures = procedures;
            this.entries = entries;
            return this;
        });
    }
    reloadEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            this.entries = yield Organ.loadEntries(this.address).catch(error => {
                console.warn("Error while reloading organ's entries", this.address, error.message);
                return this.entries;
            });
            return this;
        });
    }
    reloadProcedures() {
        return __awaiter(this, void 0, void 0, function* () {
            this.procedures = yield Organ.loadProcedures(this.address).catch(error => {
                console.warn("Error while reloading organ's procedures", this.address, error.message);
                return this.procedures;
            });
            return this;
        });
    }
    reloadData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Organ.loadData(this.address);
            this.metadata.cid = data === null || data === void 0 ? void 0 : data.metadata;
            return this;
        });
    }
}
exports.Organ = Organ;
Organ.INTERFACE = `0xf81b1307`;
exports.PERMISSIONS = {
    ADMIN: 0xffff,
    ALL: 0x07ff,
    ALL_PROCEDURES: 0x0003,
    ALL_ENTRIES: 0x000c,
    ADD_PROCEDURES: 0x0001,
    REMOVE_PROCEDURES: 0x0002,
    ADD_ENTRIES: 0x0004,
    REMOVE_ENTRIES: 0x0008,
    UPDATE_METADATA: 0x0010,
    DEPOSIT_ETHER: 0x0020,
    WITHDRAW_ETHER: 0x0040,
    DEPOSIT_COINS: 0x0080,
    WITHDRAW_COINS: 0x0100,
    DEPOSIT_COLLECTIBLES: 0x0200,
    WITHDRAW_COLLECTIBLES: 0x0400
};
const getPermissionsSet = (permissions) => Object.entries(exports.PERMISSIONS)
    .filter(permission => (permissions & permission[1]) === permission[1])
    .map(permission => permission[0]);
exports.getPermissionsSet = getPermissionsSet;
exports.default = Organ;
