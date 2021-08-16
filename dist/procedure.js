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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var Procedure_json_1 = require("@organigram/contracts/build/contracts/Procedure.json");
var web3_1 = require("./web3");
var ipfs_1 = require("./ipfs");
var web3_2 = require("web3");
var Procedure = (function () {
    function Procedure(address, metadata, proposers, moderators, deciders, withModeration, proposals) {
        this.address = address;
        this._contract = new web3_1.web3.eth.Contract(Procedure_json_1["default"].abi, address);
        this.metadata = metadata;
        this.proposers = proposers;
        this.moderators = moderators;
        this.deciders = deciders;
        this.withModeration = withModeration;
        this.proposals = proposals || [];
    }
    Procedure.initialize = function (_address, _metadata, _proposers, _moderators, _deciders, _withModeration) {
        var _args = [];
        for (var _i = 6; _i < arguments.length; _i++) {
            _args[_i - 6] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Procedure cannot be initialized.");
            });
        });
    };
    Procedure.loadData = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, data, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Procedure_json_1["default"].abi, address);
                        return [4, contract.methods.getProcedure().call()];
                    case 1:
                        data = _a.sent();
                        metadata = ipfs_1.multihashToCid(data.metadata);
                        return [2, {
                                metadata: metadata,
                                proposers: data.proposers,
                                moderators: data.moderators,
                                deciders: data.deciders,
                                withModeration: data.withModeration,
                                proposalsLength: data.proposalsLength
                            }];
                }
            });
        });
    };
    Procedure.loadProposal = function (address, proposalKey) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, proposal, metadata, blockReason, operations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Procedure_json_1["default"].abi, address);
                        return [4, contract.methods.getProposal(proposalKey).call()];
                    case 1:
                        proposal = _a.sent();
                        metadata = { cid: ipfs_1.multihashToCid(proposal.metadata) };
                        blockReason = { cid: ipfs_1.multihashToCid(proposal.blockReason) };
                        operations = proposal.operations.map(function (op) { return Procedure.parseOperation(op); });
                        return [2, {
                                key: proposalKey,
                                creator: proposal.creator,
                                metadata: metadata,
                                blockReason: blockReason,
                                presented: proposal.presented,
                                blocked: proposal.blocked,
                                adopted: proposal.adopted,
                                applied: proposal.applied,
                                operations: operations
                            }];
                }
            });
        });
    };
    Procedure.loadProposals = function (address) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var data, proposalsLength, proposals, iGenerator, _b, _c, proposalKey, key, proposal, e_1_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4, Procedure.loadData(address)];
                    case 1:
                        data = _d.sent();
                        proposalsLength = web3_2["default"].utils.toBN(data.proposalsLength);
                        proposals = [];
                        iGenerator = function () {
                            var i;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        i = web3_2["default"].utils.toBN("0");
                                        _a.label = 1;
                                    case 1:
                                        if (!i.lt(proposalsLength)) return [3, 3];
                                        return [4, i];
                                    case 2:
                                        _a.sent();
                                        i = i.addn(1);
                                        return [3, 1];
                                    case 3: return [2];
                                }
                            });
                        };
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 8, 9, 14]);
                        _b = __asyncValues(iGenerator());
                        _d.label = 3;
                    case 3: return [4, _b.next()];
                    case 4:
                        if (!(_c = _d.sent(), !_c.done)) return [3, 7];
                        proposalKey = _c.value;
                        key = proposalKey.toString();
                        return [4, Procedure.loadProposal(address, key)["catch"](function (error) {
                                console.warn("Error while loading proposal in procedure.", address, key, error.message);
                                return null;
                            })];
                    case 5:
                        proposal = _d.sent();
                        if (proposal)
                            proposals.push(proposal);
                        _d.label = 6;
                    case 6: return [3, 3];
                    case 7: return [3, 14];
                    case 8:
                        e_1_1 = _d.sent();
                        e_1 = { error: e_1_1 };
                        return [3, 14];
                    case 9:
                        _d.trys.push([9, , 12, 13]);
                        if (!(_c && !_c.done && (_a = _b["return"]))) return [3, 11];
                        return [4, _a.call(_b)];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11: return [3, 13];
                    case 12:
                        if (e_1) throw e_1.error;
                        return [7];
                    case 13: return [7];
                    case 14: return [2, proposals];
                }
            });
        });
    };
    Procedure.load = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var isProcedure, data, metadata, proposals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Procedure.isProcedure(address)["catch"](function () { return false; })];
                    case 1:
                        isProcedure = _a.sent();
                        if (!isProcedure)
                            throw new Error("Contract at address is not a Procedure.");
                        return [4, Procedure.loadData(address)];
                    case 2:
                        data = _a.sent();
                        metadata = { cid: data === null || data === void 0 ? void 0 : data.metadata };
                        return [4, Procedure.loadProposals(address)];
                    case 3:
                        proposals = _a.sent();
                        return [2, new Procedure(address, metadata, data.proposers, data.moderators, data.deciders, data.withModeration, proposals)];
                }
            });
        });
    };
    Procedure._stringifyParamType = function (type) {
        switch (type) {
            case 'metadata': return "(bytes32,uint8,uint8)";
            case 'index': return "uint256";
            case 'indexes': return "uint256[]";
            case 'permissions': return "bytes2";
            case 'addresses': return "address[]";
            case 'address': return "address";
            case 'organ': return "address";
            case 'procedure': return "address";
            case 'proposal': return "uint256";
            case 'proposals': return "uint256";
            case 'entry': return "(address,(bytes32,uint8,uint8))";
            case 'entries': return "(address,(bytes32,uint8,uint8))[]";
            default: return "";
        }
    };
    Procedure._extractParams = function (types, operation) {
        if (operation && operation.data) {
            var typesArray = types.map(Procedure._stringifyParamType);
            var decodedParams_1 = web3_1.web3.eth.abi.decodeParameters(typesArray, "0x" + operation.data.substr(10));
            return types.map(function (type, index) {
                var param = {
                    type: type,
                    value: decodedParams_1[index]
                };
                switch (param.type) {
                    case 'metadata':
                        param.value = ipfs_1.multihashToCid({
                            ipfsHash: param.value[0],
                            hashFunction: param.value[1],
                            hashSize: param.value[2]
                        });
                        break;
                    case 'entry':
                        param.value = {
                            addr: param.value[0],
                            doc: ipfs_1.multihashToCid({
                                ipfsHash: param.value[1][0],
                                hashFunction: param.value[1][1],
                                hashSize: param.value[1][2]
                            })
                        };
                        break;
                    case 'entries':
                        param.value = param.value.map(function (e) { return ({
                            addr: e[0],
                            doc: ipfs_1.multihashToCid({
                                ipfsHash: e[1][0],
                                hashFunction: e[1][1],
                                hashSize: e[1][2]
                            })
                        }); });
                        break;
                    default:
                }
                return param;
            });
        }
        else {
            return types.map(function (type) { return ({ type: type }); });
        }
    };
    Procedure.parseOperation = function (_operation) {
        var index = _operation[0], organ = _operation[1], data = _operation[2], value = _operation[3], processed = _operation[4];
        var functionSelector = data.toString().slice(0, 10);
        var operation = { index: index, organ: organ, value: value, data: data, processed: processed, functionSelector: functionSelector };
        operation["function"] = Procedure.OPERATIONS_FUNCTIONS.find(function (pof) { return pof.funcSig === functionSelector; });
        if (!operation["function"])
            return operation;
        operation.params = operation["function"].params && Procedure._extractParams(operation["function"].params, operation);
        return operation;
    };
    Procedure.isProcedure = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, isERC165, isProcedure;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_1.web3.eth.Contract(Procedure_json_1["default"].abi, address);
                        return [4, contract.methods.supportsInterface("0x01ffc9a7").call()["catch"](function () { return false; })];
                    case 1:
                        isERC165 = _a.sent();
                        if (!isERC165)
                            return [2, false];
                        return [4, contract.methods.supportsInterface(Procedure.INTERFACE).call()["catch"](function () { return false; })];
                    case 2:
                        isProcedure = _a.sent();
                        return [2, isProcedure];
                }
            });
        });
    };
    Procedure.prototype.updateMetadata = function (cid) {
        return __awaiter(this, void 0, void 0, function () {
            var multihash, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        multihash = ipfs_1.cidToMultihash(cid);
                        if (!multihash)
                            throw new Error("Wrong CID.");
                        return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, from && this._contract.methods.updateMetadata(multihash).send({ from: from })
                                .then(function () { return true; })["catch"](function (error) {
                                console.error("Error while updating metadata.", _this.address, error.message);
                                return false;
                            })];
                }
            });
        });
    };
    Procedure.prototype.updateAdmin = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, from && this._contract.methods.updateAdmin(address).send({ from: from })
                                .then(function () { return true; })["catch"](function (error) {
                                console.error("Error while updating admin.", _this.address, error.message);
                                return false;
                            })];
                }
            });
        });
    };
    Procedure.prototype.propose = function (metadata, operations) {
        return __awaiter(this, void 0, void 0, function () {
            var from, multihash, ops, proposalKey, proposal;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        multihash = ipfs_1.cidToMultihash(metadata);
                        if (!multihash)
                            throw new Error("Wrong CID.");
                        ops = operations.map(function (operation) {
                            return {
                                index: operation.index || "0",
                                organ: operation.organ,
                                data: operation.data,
                                value: operation.value,
                                processed: false
                            };
                        });
                        return [4, this._contract.methods.propose(multihash, ops).send({ from: from })];
                    case 2:
                        proposalKey = _a.sent();
                        if (!proposalKey)
                            throw new Error("Proposal not created.");
                        return [4, Procedure.loadProposal(this.address, proposalKey)];
                    case 3:
                        proposal = _a.sent();
                        if (!proposal)
                            throw new Error("Proposal not found.");
                        this.proposals.push(proposal);
                        return [2, proposal];
                }
            });
        });
    };
    Procedure.prototype.blockProposal = function (proposalKey, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var from, multihash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        multihash = ipfs_1.cidToMultihash(reason);
                        if (!multihash)
                            throw new Error("Wrong CID.");
                        return [2, this._contract.methods.blockProposal(proposalKey, multihash).send({ from: from })];
                }
            });
        });
    };
    Procedure.prototype.presentProposal = function (proposalKey) {
        return __awaiter(this, void 0, void 0, function () {
            var from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, from && this._contract.methods.presentProposal(proposalKey).send({ from: from })["catch"](function (error) {
                                console.error("Error while presenting proposal.", _this.address, proposalKey, error.message);
                                return false;
                            })];
                }
            });
        });
    };
    Procedure.prototype.adoptProposal = function (proposalKey) {
        return __awaiter(this, void 0, void 0, function () {
            var from;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, this._contract.methods.adoptProposal(proposalKey).send({ from: from })];
                }
            });
        });
    };
    Procedure.prototype.applyProposal = function (proposalKey) {
        return __awaiter(this, void 0, void 0, function () {
            var from;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_1.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, this._contract.methods.applyProposal(proposalKey).send({ from: from })];
                }
            });
        });
    };
    Procedure.prototype.reloadProposals = function () {
        return __awaiter(this, void 0, void 0, function () {
            var proposals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Procedure.loadProposals(this.address)];
                    case 1:
                        proposals = _a.sent();
                        this.proposals = proposals;
                        return [2, this];
                }
            });
        });
    };
    Procedure.prototype.reloadProposal = function (proposalKey) {
        return __awaiter(this, void 0, void 0, function () {
            var proposal, proposals;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Procedure.loadProposal(this.address, proposalKey)];
                    case 1:
                        proposal = _a.sent();
                        proposals = this.proposals.map(function (m) { return m.key === proposalKey ? proposal : m; });
                        this.proposals = proposals;
                        return [2, this];
                }
            });
        });
    };
    Procedure.prototype.reloadData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Procedure.loadData(this.address)];
                    case 1:
                        data = _a.sent();
                        this.metadata.cid = data.metadata;
                        this.proposers = data.proposers;
                        this.moderators = data.moderators;
                        this.deciders = data.deciders;
                        this.withModeration = data.withModeration;
                        return [2, this];
                }
            });
        });
    };
    Procedure.INTERFACE = "0x71dbd330";
    Procedure.OPERATIONS_PARAMS_TYPES = [
        "metadata",
        "index",
        "indexes",
        "permissions",
        "addresses",
        "address",
        "organ",
        "procedure",
        "proposal",
        "proposals",
        "entry",
        "entries"
    ];
    Procedure.OPERATIONS_FUNCTIONS = [
        {
            funcSig: "0x4d3f8407",
            key: "updateMetadata",
            signature: "updateMetadata(CoreLibrary.Metadata)",
            label: "Update metadata",
            tags: ["metadata", "replace"],
            params: ['metadata'],
            target: 'organ'
        },
        {
            funcSig: "0xbbc56af9",
            key: "addEntries",
            signature: "addEntries(OrganLibrary.Entry[])",
            label: "Add entries",
            tags: ["entries", "add"],
            params: ['entries'],
            target: 'organ'
        },
        {
            funcSig: "0x7615eb81",
            key: "removeEntries",
            signature: "removeEntries(uint256[])",
            label: "Remove entries",
            tags: ["entries", "remove"],
            params: ['indexes'],
            target: 'organ'
        },
        {
            funcSig: "0x62f7f997",
            key: "replaceEntry",
            signature: "replaceEntry(uint256,CoreLibrary.Entry)",
            label: "Replace entry",
            tags: ["entries", "replace"],
            params: ['index', 'entry'],
            target: 'organ'
        },
        {
            funcSig: "0x7f0a4e27",
            key: "addProcedure",
            signature: "addProcedure(address,bytes2)",
            label: "Add procedure",
            tags: ["procedures", "add"],
            params: ['procedure', 'permissions'],
            target: 'organ'
        },
        {
            funcSig: "0x19b9404c",
            key: "removeProcedure",
            signature: "removeProcedure(address)",
            label: "Remove procedure",
            tags: ["procedures", "remove"],
            params: ['procedure'],
            target: 'organ'
        },
        {
            funcSig: "0xd0922d4a",
            key: "replaceProcedure",
            signature: "replaceProcedure(address,address,bytes2)",
            label: "Replace procedure",
            tags: ["procedures", "replace"],
            params: ['procedure', 'procedure', 'permissions'],
            target: 'organ'
        }
    ];
    return Procedure;
}());
exports["default"] = Procedure;
