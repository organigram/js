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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organ = exports.ORGAN_CONTRACT_SIGNATURES = void 0;
const web3_1 = require("./web3");
const it_all_1 = __importDefault(require("it-all"));
const Organ_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Organ.json"));
const ipfs_1 = require("./ipfs");
const concat_1 = __importDefault(require("uint8arrays/concat"));
exports.ORGAN_CONTRACT_SIGNATURES = ((_b = (_a = Organ_json_1.default.ast
    .nodes.find(n => n.name === "")) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.map(n => (n === null || n === void 0 ? void 0 : n.functionSelector) || "").filter(i => i !== "")) || [];
class Organ {
    constructor({ address, procedures, metadata, entries }) {
        this.address = "";
        this.procedures = [];
        this.metadata = {};
        this.entries = [];
        this.updateMetadata = (metadata) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.addEntries = (entries) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.removeEntries = (indexes) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.replaceEntry = (index, entry) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.addProcedures = (procedures) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.removeProcedures = (indexes) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.replaceProcedure = (index, procedure) => __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
        this.reload = () => __awaiter(this, void 0, void 0, function* () {
            const { procedures, metadata, entries } = yield Organ.load(this.address);
            this.procedures = procedures;
            this.metadata = metadata;
            this.entries = entries;
            return this;
        });
        this.reloadEntries = () => __awaiter(this, void 0, void 0, function* () {
            this.entries = yield Organ.loadEntries(this.address)
                .catch(error => {
                console.warn("Error while reloading organ's entries", this.address, error.message);
                return this.entries;
            });
            return this;
        });
        this.reloadProcedures = () => __awaiter(this, void 0, void 0, function* () {
            this.procedures = yield Organ.loadProcedures(this.address)
                .catch(error => {
                console.warn("Error while reloading organ's procedures", this.address, error.message);
                return this.procedures;
            });
            return this;
        });
        this.reloadMetadata = () => __awaiter(this, void 0, void 0, function* () {
            this.metadata = yield Organ.loadMetadata(this.address)
                .catch(error => {
                console.warn("Error while reloading organ's metadata", this.address, error.message);
                return this.metadata;
            });
            return this;
        });
        this.address = address;
        this.procedures = procedures;
        this.metadata = metadata;
        this.entries = entries;
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOrgan = yield Organ.isOrgan(address).catch(() => false);
            if (!isOrgan)
                throw new Error("Contract at address is not an Organ.");
            const metadata = yield Organ.loadMetadata(address)
                .catch(error => {
                console.warn("Error while loading organ's metadata", address, error.message);
                return {};
            });
            const procedures = yield Organ.loadProcedures(address)
                .catch(error => {
                console.warn("Error while loading organ's procedures", address, error.message);
                return [];
            });
            const entries = yield Organ.loadEntries(address)
                .catch(error => {
                console.warn("Error while loading organ's entries", address, error.message);
                return [];
            });
            return new Organ({ address, procedures, metadata, entries });
        });
    }
    static isOrgan(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Organ_json_1.default.abi, address);
            const isERC165 = yield contract.methods.supportsInterface("0x01ffc9a7").call()
                .catch(() => false);
            if (!isERC165)
                return false;
            const ORGAN_INTERFACE = `0xbae78d7b`;
            const isOrgan = yield contract.methods.supportsInterface(ORGAN_INTERFACE).call()
                .catch(() => false);
            return isOrgan;
        });
    }
}
exports.Organ = Organ;
Organ.loadMetadata = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Organ_json_1.default.abi, address);
    const ipfs = yield ipfs_1.ipfsNode;
    if (!ipfs) {
        console.info("IPFS was not started. Starting IPFS.");
        yield ipfs.start();
    }
    let metadata = {};
    try {
        metadata.cid = yield contract.methods.getMetadata().call()
            .then((multihash) => {
            return ipfs_1.multihashToCid(multihash);
        });
    }
    catch (error) {
        console.warn("Error while computing IPFS Content ID for organ metadata.", address, error.message);
    }
    if (metadata.cid) {
        try {
            metadata.data = concat_1.default(yield it_all_1.default(ipfs.cat(metadata.cid)));
        }
        catch (error) {
            console.warn("Error while loading metadata for organ.", address, error.message);
        }
    }
    return metadata;
});
Organ.loadProcedures = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Organ_json_1.default.abi, address);
    const length = yield contract.methods.getProceduresLength().call()
        .catch(() => "0");
    if (length === "0")
        return [];
    let i = 0, promises = [];
    for (i; String(i) !== length; i++) {
        const index = String(i);
        promises.push(contract.methods.getProcedure(i).call()
            .catch((e) => console.error("Error", e.message))
            .then((data) => data && {
            address: data.procedure,
            permissions: data.permissions.toString()
        }));
    }
    return Promise.all(promises);
});
Organ.loadEntries = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Organ_json_1.default.abi, address);
    const ipfs = yield ipfs_1.ipfsNode;
    if (!ipfs) {
        console.info("IPFS was not started. Starting IPFS.");
        yield ipfs.start().catch((e) => console.warn(e.message));
    }
    const length = yield contract.methods.getEntriesLength().call()
        .catch(() => "0");
    if (length === "0")
        return [];
    var i = 1, promises = [];
    for (i; String(i) !== length; i++) {
        const index = String(i);
        promises.push(contract.methods.getEntry(index).call()
            .then(({ addr, ipfsHash, hashFunction, hashSize }) => __awaiter(void 0, void 0, void 0, function* () {
            let entry = { index, address: addr, cid: null };
            try {
                entry.cid = ipfs_1.multihashToCid({ ipfsHash, hashSize, hashFunction });
            }
            catch (error) {
                console.warn("Error while computing IPFS Content ID for entry.", address, index, error.message);
            }
            if (entry.cid) {
                try {
                    entry.data = concat_1.default(yield it_all_1.default(ipfs.cat(entry.cid)));
                }
                catch (error) {
                    console.warn("Error while loading data hash for entry.", address, index, error.message);
                }
            }
            return entry;
        }))
            .catch((e) => console.error("Error", e.message)));
    }
    return Promise.all(promises);
});
exports.default = Organ;
