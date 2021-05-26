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
exports.Graph = void 0;
const organ_1 = __importDefault(require("./organ"));
const procedure_1 = __importDefault(require("./procedure"));
class Graph {
    constructor({ organigram }) {
        this.organs = [];
        this.procedures = [];
        this._organigram = organigram;
    }
    addContracts(contracts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._organigram)
                throw new Error("Organigram not loaded.");
            contracts = contracts.filter((c) => {
                c = c.toLowerCase();
                return !this.organs.find(o => o.address.toLowerCase() === c)
                    && !this.procedures.find(p => p.address.toLowerCase() === c);
            });
            const instances = yield Promise.all(contracts.map((c) => this._organigram.getContract(c).catch(() => null)))
                .catch(error => {
                console.error("Error loading new contracts", error.message);
                return [];
            });
            instances.forEach((i) => {
                if (i) {
                    if (i instanceof organ_1.default)
                        this.organs.push(i);
                    if (i instanceof procedure_1.default)
                        this.procedures.push(i);
                }
            });
            return this;
        });
    }
    addOrgan(organ) {
        return __awaiter(this, void 0, void 0, function* () {
            const _isOrgan = yield organ_1.default.isOrgan(organ.address);
            if (_isOrgan)
                this.organs.push(organ);
            return this;
        });
    }
    addProcedure(procedure) {
        return __awaiter(this, void 0, void 0, function* () {
            const _isProcedure = yield organ_1.default.isOrgan(procedure.address);
            if (_isProcedure)
                this.procedures.push(procedure);
            return this;
        });
    }
    removeContracts(contracts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.organs = this.organs.filter(o => contracts.indexOf(o.address) < 0);
            this.procedures = this.procedures.filter(p => contracts.indexOf(p.address) < 0);
            return this;
        });
    }
    toString() {
        return JSON.stringify({
            organs: this.organs.map(o => o.toString()),
            procedures: this.procedures.map(o => o.toString())
        }, null, 2);
    }
    toJSON() {
        return {
            organs: this.organs,
            procedures: this.procedures,
        };
    }
    parseJSON(json) {
        this.organs = json.organs;
        this.procedures = json.procedures;
        return this;
    }
}
exports.Graph = Graph;
exports.default = Graph;
