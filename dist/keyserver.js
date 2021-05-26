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
const uint8arrays_1 = require("uint8arrays");
const ipfs_1 = require("./ipfs");
const organ_1 = __importDefault(require("./organ"));
const web3_1 = require("./web3");
class Keyserver extends organ_1.default {
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return organ_1.default.load(address).then(o => new Keyserver(o));
        });
    }
    hasKey(account = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!account)
                account = yield web3_1.getAccount();
            if (!account)
                throw new Error("No account selected.");
            return organ_1.default.loadEntryForAccount(this.address, account)
                .then((value) => __awaiter(this, void 0, void 0, function* () {
                return !!(value === null || value === void 0 ? void 0 : value.cid);
            }))
                .catch(() => false);
        });
    }
    loadKey(account = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!account)
                account = yield web3_1.getAccount();
            if (!account)
                throw new Error("No account selected.");
            const ipfs = yield ipfs_1.ipfsNode;
            return organ_1.default.loadEntryForAccount(this.address, account)
                .then((value) => __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                if (!value || !value.cid)
                    throw new Error("Key not found.");
                const chunks = [];
                try {
                    for (var _b = __asyncValues(ipfs.cat(value.cid)), _c; _c = yield _b.next(), !_c.done;) {
                        const chunk = _c.value;
                        chunks.push(chunk);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                const data = yield uint8arrays_1.concat(chunks);
                const key = JSON.parse(Buffer.from(data).toString());
                return key;
            }))
                .catch(_error => null);
        });
    }
    uploadKey(key, account = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!account)
                account = yield web3_1.getAccount();
            if (!account)
                throw new Error("No account selected.");
            const ipfs = yield ipfs_1.ipfsNode;
            const cid = yield ipfs.add(JSON.stringify(key))
                .then((result) => result.cid)
                .catch((error) => {
                console.error(error.message);
                throw new Error(error.message);
            });
            return this.addEntries([{
                    index: "0",
                    address: account,
                    cid: cid || ipfs_1.EMPTY_CID
                }]);
        });
    }
}
exports.default = Keyserver;
