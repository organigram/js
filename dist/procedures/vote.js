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
exports.ProcedureVote = void 0;
const web3_1 = require("../web3");
const VoteProcedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/VoteProcedure.json"));
class ProcedureVote {
    constructor({ votersOrgan, vetoersOrgan, enactorsOrgan }) {
        this.votersOrgan = votersOrgan;
        this.vetoersOrgan = vetoersOrgan;
        this.enactorsOrgan = enactorsOrgan;
    }
}
exports.ProcedureVote = ProcedureVote;
ProcedureVote.load = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    const votersOrgan = yield contract.methods.votersOrgan().call()
        .catch((error) => {
        console.warn("Error while loading voters organ address in vote procedure.", address, error.message);
        return "";
    });
    const vetoersOrgan = yield contract.methods.vetoersOrgan().call()
        .catch((error) => {
        console.warn("Error while loading vetoers organ address in vote procedure.", address, error.message);
        return "";
    });
    const enactorsOrgan = yield contract.methods.enactorsOrgan().call()
        .catch((error) => {
        console.warn("Error while loading enactors organ address in vote procedure.", address, error.message);
        return "";
    });
    return new ProcedureVote({ votersOrgan, vetoersOrgan, enactorsOrgan });
});
exports.default = ProcedureVote;
