"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.Procedure = void 0;
const concat_1 = __importDefault(require("uint8arrays/concat"));
const it_all_1 = __importDefault(require("it-all"));
const Procedure_json_1 = __importDefault(require("@organigram/contracts/abis/Procedure.json"));
const web3_1 = require("./web3");
const ipfs_1 = require("./ipfs");
class Procedure {
    constructor({ address, type, metadata, data }) {
        this.address = "";
        this.type = "";
        this.metadata = {};
        this.data = {};
        this.address = address;
        this.type = type;
        this.metadata = metadata;
        this.data = data;
    }
}
exports.Procedure = Procedure;
Procedure.load = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default, address);
    const type = "nomination";
    const metadata = yield Procedure.loadMetadata(address)
        .catch(error => {
        console.warn("Error while loading procedure metadata.", address, error.message);
        return {};
    });
    const data = yield Procedure.loadData(type, address)
        .catch(error => {
        console.warn("Error while loading procedure data.", address, error.message);
        return {};
    });
    return new Procedure({ address, type, metadata, data });
});
Procedure.loadMetadata = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default, address);
    const ipfs = yield ipfs_1.ipfsNode;
    if (!ipfs) {
        console.info("IPFS was not started. Starting IPFS.");
        yield ipfs.start();
    }
    let metadata = {};
    try {
        metadata.cid = yield contract.methods.getMetadata().call()
            .then((data) => ipfs_1.multihashToCid({
            ipfsHash: data.ipfsHash,
            hashSize: parseInt(data.hashSize),
            hashFunction: parseInt(data.hashFunction)
        }));
    }
    catch (error) {
        console.warn("Error while computing IPFS Content ID for procedure metadata.", address, error.message);
    }
    if (metadata.cid) {
        try {
            metadata.data = concat_1.default(yield it_all_1.default(ipfs.cat(metadata.cid)));
        }
        catch (error) {
            console.warn("Error while fetching metadata content for procedure.", address, error.message);
        }
    }
    return metadata;
});
Procedure.loadData = (type, address) => __awaiter(void 0, void 0, void 0, function* () {
    switch (type) {
        case 'nomination':
            const ProcedureNomination = (yield Promise.resolve().then(() => __importStar(require('./procedures/nomination')))).default;
            return ProcedureNomination.load(address);
        case 'vote':
            const ProcedureVote = (yield Promise.resolve().then(() => __importStar(require('./procedures/vote')))).default;
            return ProcedureVote.load(address);
        default:
            return {};
    }
});
exports.default = Procedure;
