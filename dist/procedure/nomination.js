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
exports.ProcedureNomination = exports.INTERFACE = void 0;
const web3_1 = require("../web3");
const SimpleNominationProcedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/SimpleNominationProcedure.json"));
exports.INTERFACE = `0xc5f28e49`;
class ProcedureNomination {
    constructor({ address, nominatersOrgan }) {
        this.address = "";
        this.nominatersOrgan = "";
        this.nominate = (moveKey) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(SimpleNominationProcedure_json_1.default.abi, this.address);
            return yield contract.methods.nominate(moveKey)
                .send({ from: web3_1.web3.eth.defaultAccount })
                .then(() => true)
                .catch((error) => {
                console.error("Error while adding special call in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.address = address;
        this.nominatersOrgan = nominatersOrgan;
    }
}
exports.ProcedureNomination = ProcedureNomination;
ProcedureNomination.load = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(SimpleNominationProcedure_json_1.default.abi, address);
    const nominatersOrgan = yield contract.methods.nominatersOrgan().call()
        .catch((error) => {
        console.warn("Error while loading nominator in nomination procedure.", address, error.message);
        return "";
    });
    const nomination = new ProcedureNomination({ address, nominatersOrgan });
    return nomination;
});
exports.default = ProcedureNomination;
