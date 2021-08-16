"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.Organigram = void 0;
var Organigram_json_1 = require("@organigram/contracts/build/contracts/Organigram.json");
var Procedure_json_1 = require("@organigram/contracts/build/contracts/Procedure.json");
var web3_1 = require("./web3");
var organ_1 = require("./organ");
var procedure_1 = require("./procedure");
var ipfs_1 = require("./ipfs");
var Organigram = (function () {
    function Organigram(address, network, proceduresRegistry, procedureTypes) {
        this._contract = new web3_1.web3.eth.Contract(Organigram_json_1["default"].abi, address);
        this.address = address;
        this.network = network;
        this.proceduresRegistry = proceduresRegistry;
        this.procedureTypes = procedureTypes;
        this.organs = [];
        this.procedures = [];
        this.graphs = [];
        this.cids = [];
    }
    Organigram.loadProcedureType = function (_a) {
        var _b;
        var addr = _a.addr, doc = _a.doc;
        return __awaiter(this, void 0, void 0, function () {
            var contract, Class, label, key, metadata, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Procedure_json_1["default"].abi, addr);
                        Class = null, label = "", key = "", metadata = {};
                        return [4, contract.methods.supportsInterface("0x01ffc9a7").call()["catch"](function () { return false; })];
                    case 1:
                        if (!(_c.sent()))
                            throw new Error("Contract does not support interfaces.");
                        return [4, contract.methods.supportsInterface(procedure_1["default"].INTERFACE).call()["catch"](function () { return false; })];
                    case 2:
                        if (!(_c.sent()))
                            throw new Error("Contract is not a procedure.");
                        if (!doc) return [3, 6];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 5, , 6]);
                        return [4, ipfs_1.parseJSON(doc)];
                    case 4:
                        metadata = _c.sent();
                        return [3, 6];
                    case 5:
                        error_1 = _c.sent();
                        console.warn(error_1.message, doc);
                        return [3, 6];
                    case 6:
                        if (metadata === null || metadata === void 0 ? void 0 : metadata.type) {
                            switch (metadata.type) {
                                case 'nomination':
                                case 'vote':
                                case 'erc20vote':
                                    key = metadata.type;
                                    label = metadata.name || label;
                                    Class = (_b = require("@organigram/procedures/dist/" + metadata.type + "/class")) === null || _b === void 0 ? void 0 : _b["default"];
                                    break;
                                default:
                            }
                        }
                        return [2, {
                                label: label,
                                key: key,
                                address: addr,
                                metadata: __assign(__assign({}, metadata), { cid: doc }),
                                Class: Class
                            }];
                }
            });
        });
    };
    Organigram.loadProcedureTypes = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, proceduresRegistry, procedures, procedureTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Organigram_json_1["default"].abi, address);
                        return [4, contract.methods.procedures().call()];
                    case 1:
                        proceduresRegistry = _a.sent();
                        return [4, organ_1["default"].loadEntries(proceduresRegistry)];
                    case 2:
                        procedures = _a.sent();
                        return [4, Promise.all(procedures.map(function (procedure) { return Organigram.loadProcedureType({
                                addr: procedure.address,
                                doc: procedure.cid
                            }); }))];
                    case 3:
                        procedureTypes = _a.sent();
                        return [2, procedureTypes];
                }
            });
        });
    };
    Organigram.load = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, network, proceduresRegistryAddress, proceduresRegistry, procedureTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Organigram_json_1["default"].abi, address);
                        return [4, web3_1.getNetwork()];
                    case 1:
                        network = _a.sent();
                        return [4, contract.methods.procedures().call()];
                    case 2:
                        proceduresRegistryAddress = _a.sent();
                        return [4, organ_1["default"].load(proceduresRegistryAddress)];
                    case 3:
                        proceduresRegistry = _a.sent();
                        return [4, Organigram.loadProcedureTypes(address)];
                    case 4:
                        procedureTypes = _a.sent();
                        return [2, new Organigram(address, network, proceduresRegistry, procedureTypes)];
                }
            });
        });
    };
    Organigram.prototype.getProcedureType = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var code, type, procedureType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.web3.eth.getCode(address)];
                    case 1:
                        code = _a.sent();
                        type = ("0x" + code.substr(22, 40)).toLowerCase();
                        procedureType = this.procedureTypes.find(function (pt) { return pt.address.toLowerCase() === type; });
                        return [2, procedureType || null];
                }
            });
        });
    };
    Organigram.prototype.getOrgan = function (address, cached) {
        if (cached === void 0) { cached = true; }
        return __awaiter(this, void 0, void 0, function () {
            var organ;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        organ = cached && this.organs.find(function (c) { return c.address === address; });
                        if (!!organ) return [3, 2];
                        return [4, organ_1["default"].load(address)];
                    case 1:
                        organ = _a.sent();
                        if (organ) {
                            this.organs.push(organ);
                        }
                        _a.label = 2;
                    case 2:
                        if (!organ) {
                            throw new Error("Organ not found.");
                        }
                        return [2, organ];
                }
            });
        });
    };
    Organigram.prototype.getProcedure = function (address, cached) {
        if (cached === void 0) { cached = true; }
        return __awaiter(this, void 0, void 0, function () {
            var procedureType, procedure;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getProcedureType(address)];
                    case 1:
                        procedureType = _a.sent();
                        if (!procedureType) {
                            throw new Error("Procedure not supported.");
                        }
                        procedure = cached && this.procedures.find(function (c) { return c.address === address; });
                        if (!!procedure) return [3, 3];
                        return [4, procedureType.Class.load(address)["catch"](function (error) { return console.error(error.message); })];
                    case 2:
                        procedure = _a.sent();
                        if (procedure) {
                            procedure.type = procedureType;
                            this.procedures.push(procedure);
                        }
                        _a.label = 3;
                    case 3:
                        if (!procedure) {
                            throw new Error("Procedure not found.");
                        }
                        procedure.type = procedureType;
                        return [2, procedure];
                }
            });
        });
    };
    Organigram.prototype.getContract = function (address, cached) {
        if (cached === void 0) { cached = true; }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, organ_1["default"].isOrgan(address)];
                    case 1:
                        if (!(_b.sent())) return [3, 2];
                        _a = this.getOrgan(address, cached);
                        return [3, 4];
                    case 2: return [4, procedure_1["default"].isProcedure(address)];
                    case 3:
                        _a = (_b.sent())
                            ? this.getProcedure(address, cached)
                            : null;
                        _b.label = 4;
                    case 4: return [2, _a];
                }
            });
        });
    };
    Organigram.prototype.createOrgan = function (metadata, admin) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var from, multihash, receipt, address;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _d.sent();
                        if (!admin)
                            admin = from;
                        multihash = ipfs_1.cidToMultihash(metadata);
                        return [4, this._contract.methods.createOrgan(admin, multihash).send({ from: from })];
                    case 2:
                        receipt = _d.sent();
                        address = (_c = (_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.events) === null || _a === void 0 ? void 0 : _a.organCreated) === null || _b === void 0 ? void 0 : _b.returnValues) === null || _c === void 0 ? void 0 : _c.organ;
                        return [2, this.getOrgan(address)];
                }
            });
        });
    };
    Organigram.prototype.createProcedure = function (type, metadata, proposers, moderators, deciders, withModeration) {
        var _a, _b, _c;
        var args = [];
        for (var _i = 6; _i < arguments.length; _i++) {
            args[_i - 6] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var from, procedureType, receipt, address, error_2;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _e.sent();
                        procedureType = this.procedureTypes.find(function (pt) { return pt.address.toLowerCase() === type.toLowerCase(); });
                        if (!(procedureType === null || procedureType === void 0 ? void 0 : procedureType.address) || !procedureType.Class)
                            throw new Error("Procedure type not found.");
                        return [4, this._contract.methods.createProcedure(procedureType.address).send({ from: from })];
                    case 2:
                        receipt = _e.sent();
                        address = (_c = (_b = (_a = receipt === null || receipt === void 0 ? void 0 : receipt.events) === null || _a === void 0 ? void 0 : _a.procedureCreated) === null || _b === void 0 ? void 0 : _b.returnValues) === null || _c === void 0 ? void 0 : _c.procedure;
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        return [4, (_d = procedureType.Class).initialize.apply(_d, __spreadArrays([address,
                                metadata,
                                proposers,
                                moderators,
                                deciders,
                                withModeration], args))];
                    case 4:
                        _e.sent();
                        return [3, 6];
                    case 5:
                        error_2 = _e.sent();
                        console.error(error_2.message);
                        throw error_2;
                    case 6: return [2, this.getProcedure(address, false)];
                }
            });
        });
    };
    Organigram.prototype.cidToJson = function (cid, cached) {
        var _a;
        if (cached === void 0) { cached = true; }
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        cid = cid.toString();
                        data = cached ? (_a = this.cids.find(function (c) { return c.cid === cid; })) === null || _a === void 0 ? void 0 : _a.data : undefined;
                        if (!!data) return [3, 2];
                        return [4, ipfs_1.parseJSON(cid)["catch"](function (error) { return console.error(error.message); })];
                    case 1:
                        data = _b.sent();
                        if (data) {
                            this.cids.push({ cid: cid, data: data });
                        }
                        _b.label = 2;
                    case 2:
                        if (!data) {
                            throw new Error("Procedure not found.");
                        }
                        return [2, data];
                }
            });
        });
    };
    Organigram.prototype.deployGraph = function (graph) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Not implemented.");
            });
        });
    };
    return Organigram;
}());
exports.Organigram = Organigram;
exports["default"] = Organigram;
