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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var _a, _b;
exports.__esModule = true;
exports.getPermissionsSet = exports.PERMISSIONS = exports.Organ = exports.ORGAN_CONTRACT_SIGNATURES = void 0;
var web3_1 = require("web3");
var it_all_1 = require("it-all");
var concat_1 = require("uint8arrays/concat");
var Organ_json_1 = require("@organigram/contracts/build/contracts/Organ.json");
var web3_2 = require("./web3");
var ipfs_1 = require("./ipfs");
exports.ORGAN_CONTRACT_SIGNATURES = ((_b = (_a = Organ_json_1["default"].ast.nodes
    .find(function (n) { return n.name === ''; })) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.map(function (n) { return (n === null || n === void 0 ? void 0 : n.functionSelector) || ''; }).filter(function (i) { return i !== ''; })) || [];
var Organ = (function () {
    function Organ(_a) {
        var _this = this;
        var address = _a.address, network = _a.network, balance = _a.balance, procedures = _a.procedures, metadata = _a.metadata, entries = _a.entries;
        this.address = '';
        this.network = 'mainnet';
        this.balance = 'n/a';
        this.procedures = [];
        this.entries = [];
        this.updateMetadata = function (cid) {
            if (cid === void 0) { cid = ipfs_1.CID.parse('QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH'); }
            return __awaiter(_this, void 0, void 0, function () {
                var contract, multihash, ipfsHash, hashFunction, hashSize, from;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                            multihash = ipfs_1.cidToMultihash(cid);
                            if (!multihash)
                                throw new Error('Wrong CID.');
                            ipfsHash = multihash.ipfsHash, hashFunction = multihash.hashFunction, hashSize = multihash.hashSize;
                            return [4, web3_2.getAccount()];
                        case 1:
                            from = _a.sent();
                            return [2, (from &&
                                    contract.methods
                                        .updateMetadata({ ipfsHash: ipfsHash, hashFunction: hashFunction, hashSize: hashSize })
                                        .send({ from: from })
                                        .then(function () { return true; })["catch"](function (error) {
                                        console.error('Error while updating metadata.', _this.address, error.message);
                                        return false;
                                    }))];
                    }
                });
            });
        };
        this.addEntries = function (entries) { return __awaiter(_this, void 0, void 0, function () {
            var contract, _entries, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        _entries = entries.map(function (e) {
                            var multihash = e.cid && ipfs_1.cidToMultihash(e.cid);
                            if (!multihash)
                                throw new Error("Wrong IPFS Content ID '" + e.cid + "' for entry.");
                            var ipfsHash = multihash.ipfsHash, hashFunction = multihash.hashFunction, hashSize = multihash.hashSize;
                            return { addr: e.address, doc: { ipfsHash: ipfsHash, hashFunction: hashFunction, hashSize: hashSize } };
                        });
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, (from &&
                                contract.methods
                                    .addEntries(_entries)
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while adding entries to organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.removeEntries = function (indexes) { return __awaiter(_this, void 0, void 0, function () {
            var contract, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, (from &&
                                contract.methods
                                    .removeEntries(indexes)
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while removing entries in organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.replaceEntry = function (index, entry) { return __awaiter(_this, void 0, void 0, function () {
            var contract, multihash, ipfsHash, hashFunction, hashSize, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        multihash = entry.cid && ipfs_1.cidToMultihash(entry.cid);
                        if (!multihash)
                            throw new Error('Wrong CID.');
                        ipfsHash = multihash.ipfsHash, hashFunction = multihash.hashFunction, hashSize = multihash.hashSize;
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, (from &&
                                contract.methods
                                    .replaceEntry(index, entry.address, {
                                    ipfsHash: ipfsHash,
                                    hashFunction: hashFunction,
                                    hashSize: hashSize
                                })
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while replacing entry in organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.addProcedure = function (procedure) { return __awaiter(_this, void 0, void 0, function () {
            var contract, from, permissions;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        permissions = "0x" + (procedure.permissions || 0)
                            .toString(16)
                            .padStart(4, '0');
                        return [2, (from &&
                                contract.methods
                                    .addProcedure(procedure.address, permissions)
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while adding procedures in organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.removeProcedure = function (procedure) { return __awaiter(_this, void 0, void 0, function () {
            var contract, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, (from &&
                                contract.methods
                                    .removeProcedure(procedure)
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while removing procedure in organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.replaceProcedure = function (oldProcedure, newOrganProcedure) { return __awaiter(_this, void 0, void 0, function () {
            var contract, permissions, from;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, this.address);
                        permissions = "0x" + (newOrganProcedure.permissions || 0)
                            .toString(16)
                            .padStart(4, '0');
                        return [4, web3_2.getAccount()];
                    case 1:
                        from = _a.sent();
                        return [2, (from &&
                                contract.methods
                                    .replaceProcedure(oldProcedure, newOrganProcedure.address, permissions)
                                    .send({ from: from })
                                    .then(function () { return true; })["catch"](function (error) {
                                    console.error('Error while replacing procedure in organ.', _this.address, error.message);
                                    return false;
                                }))];
                }
            });
        }); };
        this.address = address;
        this.network = network;
        this.balance = balance;
        this.procedures = procedures;
        this.metadata = metadata;
        this.entries = entries;
    }
    Organ.load = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var network, isOrgan, balance, organData, metadata, procedures, entries;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_2.getNetwork()];
                    case 1:
                        network = _a.sent();
                        if (!network)
                            throw new Error('Not connected to a valid network.');
                        return [4, Organ.isOrgan(address)["catch"](function () { return false; })];
                    case 2:
                        isOrgan = _a.sent();
                        return [4, Organ.getBalance(address)["catch"](function () { return 'n/a'; })];
                    case 3:
                        balance = _a.sent();
                        return [4, Organ.loadData(address)];
                    case 4:
                        organData = _a.sent();
                        metadata = { cid: organData === null || organData === void 0 ? void 0 : organData.metadata };
                        return [4, Organ.loadProcedures(address)["catch"](function (error) {
                                console.warn("Error while loading organ's procedures", address, error.message);
                                return [];
                            })];
                    case 5:
                        procedures = _a.sent();
                        return [4, Organ.loadEntries(address)["catch"](function (error) {
                                console.warn("Error while loading organ's entries", address, error.message);
                                return [];
                            })];
                    case 6:
                        entries = _a.sent();
                        return [2, new Organ({
                                address: address,
                                network: network,
                                balance: balance,
                                procedures: procedures,
                                metadata: metadata,
                                entries: entries
                            })];
                }
            });
        });
    };
    Organ.isOrgan = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, isERC165, isOrgan;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                        return [4, contract.methods
                                .supportsInterface('0x01ffc9a7')
                                .call()["catch"](function () { return false; })];
                    case 1:
                        isERC165 = _a.sent();
                        if (!isERC165)
                            return [2, false];
                        return [4, contract.methods
                                .supportsInterface(Organ.INTERFACE)
                                .call()["catch"](function () { return false; })];
                    case 2:
                        isOrgan = _a.sent();
                        return [2, isOrgan];
                }
            });
        });
    };
    Organ.getBalance = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var balance;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, web3_2.web3.eth.getBalance(address)];
                    case 1:
                        balance = _a.sent();
                        return [2, "" + balance];
                }
            });
        });
    };
    Organ.loadData = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, data, cid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                        return [4, contract.methods.getOrgan().call()];
                    case 1:
                        data = _a.sent();
                        cid = ipfs_1.multihashToCid(data.metadata);
                        return [2, {
                                metadata: cid,
                                proceduresLength: data === null || data === void 0 ? void 0 : data.proceduresLength,
                                entriesLength: data === null || data === void 0 ? void 0 : data.entriesLength,
                                entriesCount: data === null || data === void 0 ? void 0 : data.entriesCount
                            }];
                }
            });
        });
    };
    Organ.loadEntryForAccount = function (address, account) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                        return [4, contract.methods.getEntryIndexForAddress(account).call()];
                    case 1:
                        index = _a.sent();
                        return [2, Organ.loadEntry(address, index)];
                }
            });
        });
    };
    Organ.loadPermissions = function (address, procedure) {
        return __awaiter(this, void 0, void 0, function () {
            var contract;
            return __generator(this, function (_a) {
                contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                return [2, contract.methods
                        .getPermissions(procedure)
                        .call()["catch"](function (e) { return console.error('Error', e.message); })
                        .then(function (_a) {
                        var perms = _a.perms;
                        return perms;
                    })];
            });
        });
    };
    Organ.loadProcedure = function (address, index) {
        return __awaiter(this, void 0, void 0, function () {
            var contract;
            return __generator(this, function (_a) {
                contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                return [2, contract.methods
                        .getProcedure(index)
                        .call()["catch"](function (e) { return console.error('Error', e.message); })
                        .then(function (data) {
                        return data && {
                            address: data.addr,
                            permissions: data.perms
                        };
                    })];
            });
        });
    };
    Organ.loadProcedures = function (address) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var data, length, procedures, iGenerator, _b, _c, i, key, procedure, e_1_1;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4, Organ.loadData(address)];
                    case 1:
                        data = _d.sent();
                        length = web3_1["default"].utils.toBN(data.proceduresLength);
                        procedures = [];
                        iGenerator = function () {
                            var i;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        i = web3_1["default"].utils.toBN('0');
                                        _a.label = 1;
                                    case 1:
                                        if (!i.lt(length)) return [3, 3];
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
                        i = _c.value;
                        key = i.toString();
                        return [4, Organ.loadProcedure(address, key)["catch"](function (error) {
                                console.warn('Error while loading procedure in organ.', address, key, error.message);
                                return null;
                            })];
                    case 5:
                        procedure = _d.sent();
                        if (procedure)
                            procedures.push(procedure);
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
                    case 14: return [2, procedures];
                }
            });
        });
    };
    Organ.loadEntry = function (address, index) {
        return __awaiter(this, void 0, void 0, function () {
            var contract, ipfs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                        return [4, ipfs_1.ipfsNode];
                    case 1:
                        ipfs = _a.sent();
                        if (!!ipfs) return [3, 3];
                        console.info('IPFS was not started. Starting IPFS.');
                        return [4, ipfs.start()["catch"](function (e) { return console.warn(e.message); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2, contract.methods
                            .getEntry(index)
                            .call()
                            .then(function (_a) {
                            var addr = _a.addr, doc = _a.doc;
                            return __awaiter(_this, void 0, void 0, function () {
                                var entry, _b, _c, error_1;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            if (addr === web3_2.EMPTY_ADDRESS &&
                                                (!parseInt(doc.hashFunction, 16) || !parseInt(doc.hashSize)))
                                                return [2, null];
                                            entry = {
                                                index: index,
                                                address: addr,
                                                cid: ipfs_1.multihashToCid(doc)
                                            };
                                            if (!entry.cid) return [3, 4];
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 3, , 4]);
                                            _b = entry;
                                            _c = concat_1["default"];
                                            return [4, it_all_1["default"](ipfs.cat(entry.cid))];
                                        case 2:
                                            _b.data = _c.apply(void 0, [_d.sent()]);
                                            return [3, 4];
                                        case 3:
                                            error_1 = _d.sent();
                                            console.warn('Error while loading data hash for entry.', address, index, error_1.message);
                                            return [3, 4];
                                        case 4: return [2, entry];
                                    }
                                });
                            });
                        })];
                }
            });
        });
    };
    Organ.loadEntries = function (address) {
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function () {
            var length, _b, _c, entries, iGenerator, _d, _e, index, key, entry, e_2_1;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _c = (_b = web3_1["default"].utils).toBN;
                        return [4, Organ.loadData(address)];
                    case 1:
                        length = _c.apply(_b, [(_f.sent()).entriesLength]);
                        entries = [];
                        iGenerator = function () {
                            var i;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        i = web3_1["default"].utils.toBN('1');
                                        _a.label = 1;
                                    case 1:
                                        if (!i.lt(length)) return [3, 3];
                                        return [4, i];
                                    case 2:
                                        _a.sent();
                                        i = i.addn(1);
                                        return [3, 1];
                                    case 3: return [2];
                                }
                            });
                        };
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 8, 9, 14]);
                        _d = __asyncValues(iGenerator());
                        _f.label = 3;
                    case 3: return [4, _d.next()];
                    case 4:
                        if (!(_e = _f.sent(), !_e.done)) return [3, 7];
                        index = _e.value;
                        key = index.toString();
                        return [4, Organ.loadEntry(address, key)["catch"](function (error) {
                                console.warn('Error while loading entry in organ.', address, key, error.message);
                                return null;
                            })];
                    case 5:
                        entry = _f.sent();
                        if (entry)
                            entries.push(entry);
                        _f.label = 6;
                    case 6: return [3, 3];
                    case 7: return [3, 14];
                    case 8:
                        e_2_1 = _f.sent();
                        e_2 = { error: e_2_1 };
                        return [3, 14];
                    case 9:
                        _f.trys.push([9, , 12, 13]);
                        if (!(_e && !_e.done && (_a = _d["return"]))) return [3, 11];
                        return [4, _a.call(_d)];
                    case 10:
                        _f.sent();
                        _f.label = 11;
                    case 11: return [3, 13];
                    case 12:
                        if (e_2) throw e_2.error;
                        return [7];
                    case 13: return [7];
                    case 14: return [2, entries];
                }
            });
        });
    };
    Organ.generateEncodedABI = function (address, functionName) {
        var _a, _b, _c, _d;
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var contract;
            return __generator(this, function (_e) {
                contract = new web3_2.web3.eth.Contract(Organ_json_1["default"].abi, address);
                return [2, (_d = (_c = (_b = (_a = contract === null || contract === void 0 ? void 0 : contract.methods) === null || _a === void 0 ? void 0 : _a[functionName]) === null || _b === void 0 ? void 0 : _b.call.apply(_b, __spreadArrays([_a], args))) === null || _c === void 0 ? void 0 : _c.encodeABI) === null || _d === void 0 ? void 0 : _d.call(_c)];
            });
        });
    };
    Organ.prototype.reload = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, procedures, metadata, entries;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, Organ.load(this.address)];
                    case 1:
                        _a = _b.sent(), procedures = _a.procedures, metadata = _a.metadata, entries = _a.entries;
                        this.metadata = metadata;
                        this.procedures = procedures;
                        this.entries = entries;
                        return [2, this];
                }
            });
        });
    };
    Organ.prototype.reloadEntries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, Organ.loadEntries(this.address)["catch"](function (error) {
                                console.warn("Error while reloading organ's entries", _this.address, error.message);
                                return _this.entries;
                            })];
                    case 1:
                        _a.entries = _b.sent();
                        return [2, this];
                }
            });
        });
    };
    Organ.prototype.reloadProcedures = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, Organ.loadProcedures(this.address)["catch"](function (error) {
                                console.warn("Error while reloading organ's procedures", _this.address, error.message);
                                return _this.procedures;
                            })];
                    case 1:
                        _a.procedures = _b.sent();
                        return [2, this];
                }
            });
        });
    };
    Organ.prototype.reloadData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, Organ.loadData(this.address)];
                    case 1:
                        data = _a.sent();
                        this.metadata.cid = data === null || data === void 0 ? void 0 : data.metadata;
                        return [2, this];
                }
            });
        });
    };
    Organ.INTERFACE = "0xf81b1307";
    return Organ;
}());
exports.Organ = Organ;
exports.PERMISSIONS = {
    ADMIN: 0xffff,
    ALL: 0x07ff,
    ALL_PROCEDURES: 0x0003,
    ALL_ENTRIES: 0x000c,
    ADD_PROCEDURES: 0x0001,
    REMOVE_PROCEDURES: 0x0002,
    ADD_ENTRIES: 0x0004,
    REMOVE_ENTRIES: 0x0008,
    UPDATE_METADATA: 0x0010,
    DEPOSIT_ETHER: 0x0020,
    WITHDRAW_ETHER: 0x0040,
    DEPOSIT_COINS: 0x0080,
    WITHDRAW_COINS: 0x0100,
    DEPOSIT_COLLECTIBLES: 0x0200,
    WITHDRAW_COLLECTIBLES: 0x0400
};
var getPermissionsSet = function (permissions) {
    return Object && Object.entries && Object.entries(exports.PERMISSIONS)
        .filter(function (permission) { return (permissions & permission[1]) === permission[1]; })
        .map(function (permission) { return permission[0]; });
};
exports.getPermissionsSet = getPermissionsSet;
exports["default"] = Organ;
