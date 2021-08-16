"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var uint8arrays_1 = require("uint8arrays");
var ipfs_1 = require("./ipfs");
var organ_1 = require("./organ");
var web3_1 = require("./web3");
var Keyserver = (function (_super) {
    __extends(Keyserver, _super);
    function Keyserver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Keyserver.load = function (address) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, organ_1["default"].load(address).then(function (o) { return new Keyserver(o); })];
            });
        });
    };
    Keyserver.prototype.hasKey = function (account) {
        if (account === void 0) { account = null; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!account) return [3, 2];
                        return [4, web3_1.getAccount()];
                    case 1:
                        account = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!account)
                            throw new Error("No account selected.");
                        return [2, organ_1["default"].loadEntryForAccount(this.address, account)
                                .then(function (value) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2, !!(value === null || value === void 0 ? void 0 : value.cid)];
                                });
                            }); })["catch"](function () { return false; })];
                }
            });
        });
    };
    Keyserver.prototype.loadKey = function (account) {
        if (account === void 0) { account = null; }
        return __awaiter(this, void 0, void 0, function () {
            var ipfs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!account) return [3, 2];
                        return [4, web3_1.getAccount()];
                    case 1:
                        account = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!account)
                            throw new Error("No account selected.");
                        return [4, ipfs_1.ipfsNode];
                    case 3:
                        ipfs = _a.sent();
                        return [2, organ_1["default"].loadEntryForAccount(this.address, account)
                                .then(function (value) { return __awaiter(_this, void 0, void 0, function () {
                                var chunks, _a, _b, chunk, e_1_1, data, key;
                                var e_1, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            if (!value || !value.cid)
                                                throw new Error("Key not found.");
                                            chunks = [];
                                            _d.label = 1;
                                        case 1:
                                            _d.trys.push([1, 6, 7, 12]);
                                            _a = __asyncValues(ipfs.cat(value.cid));
                                            _d.label = 2;
                                        case 2: return [4, _a.next()];
                                        case 3:
                                            if (!(_b = _d.sent(), !_b.done)) return [3, 5];
                                            chunk = _b.value;
                                            chunks.push(chunk);
                                            _d.label = 4;
                                        case 4: return [3, 2];
                                        case 5: return [3, 12];
                                        case 6:
                                            e_1_1 = _d.sent();
                                            e_1 = { error: e_1_1 };
                                            return [3, 12];
                                        case 7:
                                            _d.trys.push([7, , 10, 11]);
                                            if (!(_b && !_b.done && (_c = _a["return"]))) return [3, 9];
                                            return [4, _c.call(_a)];
                                        case 8:
                                            _d.sent();
                                            _d.label = 9;
                                        case 9: return [3, 11];
                                        case 10:
                                            if (e_1) throw e_1.error;
                                            return [7];
                                        case 11: return [7];
                                        case 12: return [4, uint8arrays_1.concat(chunks)];
                                        case 13:
                                            data = _d.sent();
                                            key = JSON.parse(Buffer.from(data).toString());
                                            return [2, key];
                                    }
                                });
                            }); })["catch"](function (_error) { return null; })];
                }
            });
        });
    };
    Keyserver.prototype.uploadKey = function (key, account) {
        if (account === void 0) { account = null; }
        return __awaiter(this, void 0, void 0, function () {
            var ipfs, cid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!account) return [3, 2];
                        return [4, web3_1.getAccount()];
                    case 1:
                        account = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!account)
                            throw new Error("No account selected.");
                        return [4, ipfs_1.ipfsNode];
                    case 3:
                        ipfs = _a.sent();
                        return [4, ipfs.add(JSON.stringify(key))
                                .then(function (result) { return result.cid; })["catch"](function (error) {
                                console.error(error.message);
                                throw new Error(error.message);
                            })];
                    case 4:
                        cid = _a.sent();
                        return [2, this.addEntries([{
                                    index: "0",
                                    address: account,
                                    cid: cid || ipfs_1.EMPTY_CID
                                }])];
                }
            });
        });
    };
    return Keyserver;
}(organ_1["default"]));
exports["default"] = Keyserver;
