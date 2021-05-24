"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.CID = exports.EMPTY_MULTIHASH = exports.EMPTY_CID = exports.parseJSON = exports.uint8ArrayToString = exports.urlToCID = exports.cidToMultihash = exports.multihashToCid = exports.ipfsNode = exports.IPFS = void 0;
const IPFS = __importStar(require("ipfs-core"));
exports.IPFS = IPFS;
const to_string_1 = __importDefault(require("uint8arrays/to-string"));
const concat_1 = __importDefault(require("uint8arrays/concat"));
const ipfs_provider_1 = require("ipfs-provider");
const { httpClient, jsIpfs } = ipfs_provider_1.providers;
const ipfsNode = ipfs_provider_1.getIpfs({
    providers: [
        httpClient(),
        jsIpfs({
            loadJsIpfsModule: () => require('ipfs-core'),
            options: {}
        })
    ]
})
    .then(({ ipfs }) => __awaiter(void 0, void 0, void 0, function* () {
    if (ipfs === null || ipfs === void 0 ? void 0 : ipfs.enable) {
        yield ipfs.enable({ commands: ['id', 'add', 'cat', 'get'] });
        console.info('IPFS enabled.');
    }
    return ipfs;
}));
exports.ipfsNode = ipfsNode;
const multihashToCid = ({ ipfsHash, hashFunction, hashSize }) => {
    if (!parseInt(hashFunction) || !parseInt(hashSize))
        return null;
    const multihash = Buffer.from(parseInt(hashFunction).toString(16).padStart(2, "0") +
        parseInt(hashSize).toString(16).padStart(2, "0") +
        ipfsHash.substring(2), 'hex');
    try {
        return new IPFS.CID(multihash);
    }
    catch (e) {
        console.warn("Error computing IPFS CID from given multihash.");
        return null;
    }
};
exports.multihashToCid = multihashToCid;
const cidToMultihash = (cid) => {
    var _a;
    if (!cid)
        cid = EMPTY_CID;
    if (typeof cid === "string")
        cid = new IPFS.CID(`${cid}`);
    const multihash = ((_a = cid === null || cid === void 0 ? void 0 : cid.hash) === null || _a === void 0 ? void 0 : _a.data) ?
        Buffer.from(cid.hash.data)
        : (cid === null || cid === void 0 ? void 0 : cid.multihash) ?
            Buffer.from(cid.multihash)
            : null;
    return multihash && {
        ipfsHash: `0x${multihash.slice(2).toString('hex')}`,
        hashSize: `0x${multihash.slice(1, 2).toString('hex')}`,
        hashFunction: `0x${multihash.slice(0, 1).toString('hex')}`
    };
};
exports.cidToMultihash = cidToMultihash;
const urlToCID = (url) => {
    try {
        return new CID(url.substring(21));
    }
    catch (error) {
        console.warn("Unable to convert IPFS url to CID.");
        return null;
    }
};
exports.urlToCID = urlToCID;
const uint8ArrayToString = (uint8Array) => to_string_1.default(uint8Array);
exports.uint8ArrayToString = uint8ArrayToString;
const parseJSON = (cid) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const ipfs = yield Promise.resolve(ipfsNode);
    const chunks = [];
    try {
        for (var _b = __asyncValues(ipfs.cat(cid)), _c; _c = yield _b.next(), !_c.done;) {
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
    return JSON.parse(to_string_1.default(concat_1.default(chunks)));
});
exports.parseJSON = parseJSON;
const EMPTY_CID = `QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH`;
exports.EMPTY_CID = EMPTY_CID;
const EMPTY_MULTIHASH = cidToMultihash(EMPTY_CID);
exports.EMPTY_MULTIHASH = EMPTY_MULTIHASH;
const CID = IPFS.CID;
exports.CID = CID;
