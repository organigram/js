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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Graph = void 0;
const web3_1 = require("./web3");
const organ_1 = __importDefault(require("./organ"));
const procedure_1 = __importDefault(require("./procedure"));
const Kelsen_json_1 = __importDefault(require("@organigram/contracts/abis/Kelsen.json"));
class Graph {
    constructor({ organs, procedures }) {
        this.organs = [];
        this.procedures = [];
        this.toString = () => JSON.stringify({
            organs: this.organs.map(o => o.toString()),
            procedures: this.procedures.map(o => o.toString())
        }, null, 2);
        this.addOrgans = (organs) => __awaiter(this, void 0, void 0, function* () {
            this.organs = [
                ...this.organs,
                ...organs.map(data => new organ_1.default(data))
            ];
            return this;
        });
        this.addProcedures = (procedures) => __awaiter(this, void 0, void 0, function* () {
            this.procedures = [
                ...this.procedures,
                ...procedures.map(data => new procedure_1.default(data))
            ];
            return this;
        });
        this.organs = organs;
        this.procedures = procedures;
    }
    static sort(contracts) {
        var contracts_1, contracts_1_1;
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let organs = [], procedures = [];
            try {
                for (contracts_1 = __asyncValues(contracts); contracts_1_1 = yield contracts_1.next(), !contracts_1_1.done;) {
                    var address = contracts_1_1.value;
                    const contract = yield new web3_1.web3.eth.Contract(Kelsen_json_1.default, address);
                    const isOrgan = yield contract.methods.isOrgan().call();
                    const isProcedure = yield contract.methods.isProcedure().call();
                    if (isOrgan)
                        organs.push(address);
                    if (isProcedure)
                        procedures.push(address);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (contracts_1_1 && !contracts_1_1.done && (_a = contracts_1.return)) yield _a.call(contracts_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return { organs, procedures };
        });
    }
    static load(contracts) {
        return __awaiter(this, void 0, void 0, function* () {
            const { organs, procedures } = yield Graph.sort(contracts);
            const graph = new Graph({
                organs: yield Promise.all(organs.map(a => organ_1.default.load(a))),
                procedures: yield Promise.all(procedures.map(a => procedure_1.default.load(a)))
            });
            console.log("GRAPH IS HERE", graph);
            return graph;
        });
    }
}
exports.Graph = Graph;
exports.default = Graph;
