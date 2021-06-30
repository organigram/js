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
    }
    static loadProcedureType({ addr, doc }) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, addr);
            let Class = null, label = "";
            if (!(yield contract.methods.supportsInterface("0x01ffc9a7").call().catch(() => false)))
                throw new Error("Contract does not support interfaces.");
            if (!(yield contract.methods.supportsInterface(procedure_1.default.INTERFACE).call().catch(() => false)))
                throw new Error("Contract is not a procedure.");
            return {
                label,
                address: addr,
                metadata: { cid: doc },
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
            if (!organ)
                organ = yield organ_1.default.load(address);
            if (!organ)
                throw new Error("Organ not found.");
            this.organs.push(organ);
            return organ;
        });
    }
    getProcedure(address, cached = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const procedureType = yield this.getProcedureType(address);
            if (!procedureType)
                throw new Error("Procedure not supported.");
            let procedure = cached && this.procedures.find(c => c.address === address);
            if (!procedure)
                procedure = yield procedureType.Class.load(address);
            if (!procedure)
                throw new Error("Procedure not found.");
            procedure.type = procedureType;
            this.procedures.push(procedure);
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
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            if (!admin)
                admin = from;
            const multihash = ipfs_1.cidToMultihash(metadata);
            const address = yield this._contract.methods.createOrgan(admin, multihash).send({ from });
            return this.getOrgan(address);
        });
    }
    createProcedure(type, metadata, proposers, moderators, deciders, withModeration, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            const procedureType = yield this.getProcedureType(type);
            if (!(procedureType === null || procedureType === void 0 ? void 0 : procedureType.address) || !procedureType.Class)
                throw new Error("Procedure type not found.");
            const address = yield this._contract.methods.createProcedure(procedureType.address).send({ from });
            yield procedureType.Class.initialize(address, metadata, proposers, moderators, deciders, withModeration, ...args);
            return this.getProcedure(address, false);
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
