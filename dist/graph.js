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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Graph = void 0;
var organ_1 = require("./organ");
var procedure_1 = require("./procedure");
var Graph = (function () {
    function Graph(_a) {
        var organigram = _a.organigram;
        this.organs = [];
        this.procedures = [];
        this._organigram = organigram;
    }
    Graph.prototype.addContracts = function (contracts) {
        return __awaiter(this, void 0, void 0, function () {
            var instances;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._organigram)
                            throw new Error("Organigram not loaded.");
                        contracts = contracts.filter(function (c) {
                            c = c.toLowerCase();
                            return !_this.organs.find(function (o) { return o.address.toLowerCase() === c; })
                                && !_this.procedures.find(function (p) { return p.address.toLowerCase() === c; });
                        });
                        return [4, Promise.all(contracts.map(function (c) { return _this._organigram.getContract(c)["catch"](function () { return null; }); }))["catch"](function (error) {
                                console.error("Error loading new contracts", error.message);
                                return [];
                            })];
                    case 1:
                        instances = _a.sent();
                        instances.forEach(function (i) {
                            if (i) {
                                if (i instanceof organ_1["default"])
                                    _this.organs.push(i);
                                if (i instanceof procedure_1["default"])
                                    _this.procedures.push(i);
                            }
                        });
                        return [2, this];
                }
            });
        });
    };
    Graph.prototype.addOrgan = function (organ) {
        return __awaiter(this, void 0, void 0, function () {
            var _isOrgan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, organ_1["default"].isOrgan(organ.address)];
                    case 1:
                        _isOrgan = _a.sent();
                        if (_isOrgan)
                            this.organs.push(organ);
                        return [2, this];
                }
            });
        });
    };
    Graph.prototype.addProcedure = function (procedure) {
        return __awaiter(this, void 0, void 0, function () {
            var _isProcedure;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, organ_1["default"].isOrgan(procedure.address)];
                    case 1:
                        _isProcedure = _a.sent();
                        if (_isProcedure)
                            this.procedures.push(procedure);
                        return [2, this];
                }
            });
        });
    };
    Graph.prototype.removeContracts = function (contracts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.organs = this.organs.filter(function (o) { return contracts.indexOf(o.address) < 0; });
                this.procedures = this.procedures.filter(function (p) { return contracts.indexOf(p.address) < 0; });
                return [2, this];
            });
        });
    };
    Graph.prototype.toString = function () {
        return JSON.stringify({
            organs: this.organs.map(function (o) { return o.toString(); }),
            procedures: this.procedures.map(function (o) { return o.toString(); })
        }, null, 2);
    };
    Graph.prototype.toJSON = function () {
        return {
            organs: this.organs,
            procedures: this.procedures
        };
    };
    Graph.prototype.parseJSON = function (json) {
        this.organs = json.organs;
        this.procedures = json.procedures;
        return this;
    };
    return Graph;
}());
exports.Graph = Graph;
exports["default"] = Graph;
