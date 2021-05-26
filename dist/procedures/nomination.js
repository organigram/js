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
const NominationProcedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/NominationProcedure.json"));
const web3_1 = require("../web3");
const ipfs_1 = require("../ipfs");
const procedure_1 = __importDefault(require("../procedure"));
class ProcedureNomination extends procedure_1.default {
    constructor(address, metadata, proposers, moderators, deciders, withModeration, proposals) {
        super(address, metadata, proposers, moderators, deciders, withModeration, proposals);
        this.contract = new web3_1.web3.eth.Contract(NominationProcedure_json_1.default.abi, address);
    }
    static initialize(address, metadata, proposers, moderators, deciders, _withModeration, ..._args) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(NominationProcedure_json_1.default.abi);
            const from = yield web3_1.getAccount();
            const multihash = ipfs_1.cidToMultihash(metadata);
            if (!multihash)
                throw new Error("Wrong CID.");
            yield contract.methods.initialize(address, multihash, proposers, moderators, deciders, false)
                .send({ from });
        });
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const procedure = yield procedure_1.default.load(address);
            if (!procedure)
                throw new Error("Not a valid procedure.");
            return new ProcedureNomination(procedure.address, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.proposals);
        });
    }
    nominate(proposalKey) {
        const _super = Object.create(null, {
            address: { get: () => super.address }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return from && this.contract.methods.nominate(proposalKey).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while nominating.", _super.address, proposalKey, error.message);
                return false;
            });
        });
    }
}
exports.default = ProcedureNomination;
ProcedureNomination.INTERFACE = `0xc5f28e49`;
