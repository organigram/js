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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Organigram = void 0;
const Organigram_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Organigram.json"));
const Procedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Procedure.json"));
const web3_1 = require("./web3");
const organ_1 = __importDefault(require("./organ"));
const procedure_1 = __importDefault(require("./procedure"));
const ipfs_1 = require("./ipfs");
class Organigram {
    constructor(address, network, proceduresRegistry, procedureTypes) {
        this._contract = new web3_1.web3.eth.Contract(Organigram_json_1.default.abi, address);
        this.address = address;
        this.network = network;
        this.proceduresRegistry = proceduresRegistry;
        this.procedureTypes = procedureTypes;
        this.organs = [];
        this.procedures = [];
        this.graphs = [];
        this.cids = [];
    }
    static loadProcedureType({ addr, doc }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, addr);
            let Class = null, label = "", key = "", metadata = {};
            if (!(yield contract.methods.supportsInterface("0x01ffc9a7").call().catch(() => false)))
                throw new Error("Contract does not support interfaces.");
            if (!(yield contract.methods.supportsInterface(procedure_1.default.INTERFACE).call().catch(() => false)))
                throw new Error("Contract is not a procedure.");
            if (doc) {
                try {
                    metadata = yield ipfs_1.parseJSON(doc);
                }
                catch (error) {
                    console.warn(error.message, doc);
                }
            }
            if (metadata === null || metadata === void 0 ? void 0 : metadata.type) {
                switch (metadata.type) {
                    case 'nomination':
                    case 'vote':
                    case 'erc20vote':
                        key = metadata.type;
                        label = metadata.name || label;
                        Class = (_a = require(`@organigram/procedures/dist/${metadata.type}/class`)) === null || _a === void 0 ? void 0 : _a.default;
                        break;
                    default:
                }
            }
            return {
                label,
                key,
                address: addr,
                metadata: Object.assign(Object.assign({}, metadata), { cid: doc }),
                Class
            };
        });
    }
    static loadProcedureTypes(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Organigram_json_1.default.abi, address);
            const proceduresRegistry = yield contract.methods.procedures().call();
            const procedures = yield organ_1.default.loadEntries(proceduresRegistry);
            const procedureTypes = yield Promise.all(procedures.map((procedure) => Organigram.loadProcedureType({
                addr: procedure.address,
                doc: procedure.cid
            })));
            return procedureTypes;
        });
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Organigram_json_1.default.abi, address);
            const network = yield web3_1.getNetwork();
            const proceduresRegistryAddress = yield contract.methods.procedures().call();
            const proceduresRegistry = yield organ_1.default.load(proceduresRegistryAddress);
            const procedureTypes = yield Organigram.loadProcedureTypes(address);
            return new Organigram(address, network, proceduresRegistry, procedureTypes);
        });
    }
    getProcedureType(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const code = yield web3_1.web3.eth.getCode(address);
            const type = `0x${code.substr(22, 40)}`.toLowerCase();
            const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type);
            return procedureType || null;
        });
    }
    getOrgan(address, cached = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let organ = cached && this.organs.find(c => c.address === address);
            if (!organ) {
                organ = yield organ_1.default.load(address);
                if (organ) {
                    this.organs.push(organ);
                }
            }
            if (!organ) {
                throw new Error("Organ not found.");
            }
            return organ;
        });
    }
    getProcedure(address, cached = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const procedureType = yield this.getProcedureType(address);
            if (!procedureType) {
                throw new Error("Procedure not supported.");
            }
            let procedure = cached && this.procedures.find(c => c.address === address);
            if (!procedure) {
                procedure = yield procedureType.Class.load(address)
                    .catch((error) => console.error(error.message));
                if (procedure) {
                    procedure.type = procedureType;
                    this.procedures.push(procedure);
                }
            }
            if (!procedure) {
                throw new Error("Procedure not found.");
            }
            procedure.type = procedureType;
            return procedure;
        });
    }
    getContract(address, cached = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield organ_1.default.isOrgan(address))
                ? this.getOrgan(address, cached)
                : (yield procedure_1.default.isProcedure(address))
                    ? this.getProcedure(address, cached)
                    : null;
        });
    }
    createOrgan(metadata, admin) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            if (!admin)
                admin = from;
            const multihash = ipfs_1.cidToMultihash(metadata);
            const receipt = yield this._contract.methods.createOrgan(admin, multihash).send({ from });
            const address = (_c = (_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.events) === null || _a === void 0 ? void 0 : _a.organCreated) === null || _b === void 0 ? void 0 : _b.returnValues) === null || _c === void 0 ? void 0 : _c.organ;
            return this.getOrgan(address);
        });
    }
    createProcedure(type, metadata, proposers, moderators, deciders, withModeration, ...args) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type.toLowerCase());
            if (!(procedureType === null || procedureType === void 0 ? void 0 : procedureType.address) || !procedureType.Class)
                throw new Error("Procedure type not found.");
            const receipt = yield this._contract.methods.createProcedure(procedureType.address).send({ from });
            const address = (_c = (_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.events) === null || _a === void 0 ? void 0 : _a.procedureCreated) === null || _b === void 0 ? void 0 : _b.returnValues) === null || _c === void 0 ? void 0 : _c.procedure;
            try {
                yield procedureType.Class.initialize(address, metadata, proposers, moderators, deciders, withModeration, ...args);
            }
            catch (error) {
                console.error(error.message);
                throw error;
            }
            return this.getProcedure(address, false);
        });
    }
    cidToJson(cid, cached = true) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let data = cached ? (_a = this.cids.find(c => c.cid === cid)) === null || _a === void 0 ? void 0 : _a.data : undefined;
            if (!data) {
                data = yield ipfs_1.parseJSON(cid)
                    .catch((error) => console.error(error.message));
                if (data) {
                    this.cids.push({ cid, data });
                }
            }
            if (!data) {
                throw new Error("Procedure not found.");
            }
            return data;
        });
    }
    deployGraph(graph) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not implemented.");
        });
    }
}
exports.Organigram = Organigram;
exports.default = Organigram;
