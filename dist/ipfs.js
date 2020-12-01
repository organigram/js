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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cidToMultihash = exports.multihashToCid = exports.ipfsNode = exports.IPFS = void 0;
const IPFS = __importStar(require("ipfs-core"));
exports.IPFS = IPFS;
const ipfs_provider_1 = require("ipfs-provider");
const ipfsNode = ipfs_provider_1.getIpfs({
    providers: [
        ipfs_provider_1.providers.windowIpfs({
            permissions: { commands: ['add', 'cat', 'get'] }
        }),
        ipfs_provider_1.providers.jsIpfs({
            loadJsIpfsModule: () => require('ipfs-core'),
            options: {}
        })
    ]
})
    .then((res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if ((_a = res.ipfs) === null || _a === void 0 ? void 0 : _a.enable) {
        yield res.ipfs.enable({ commands: ['id', 'add', 'cat', 'get'] });
        console.info('IPFS enabled.');
    }
    return res.ipfs;
}));
exports.ipfsNode = ipfsNode;
const multihashToCid = ({ ipfsHash, hashFunction, hashSize }) => {
    const multihash = Buffer.from(hashFunction.toString(16).padStart(2, "0") +
        hashSize.toString(16).padStart(2, "0") +
        ipfsHash.substring(2), 'hex');
    return new IPFS.CID(multihash);
};
exports.multihashToCid = multihashToCid;
const cidToMultihash = (cid) => {
    var _a;
    const multihash = ((_a = cid === null || cid === void 0 ? void 0 : cid.hash) === null || _a === void 0 ? void 0 : _a.data) ?
        Buffer.from(cid.hash.data)
        : (cid === null || cid === void 0 ? void 0 : cid.multihash) ?
            Buffer.from(cid.multihash)
            : null;
    return multihash && {
        ipfsHash: `0x${multihash.slice(2).toString('hex')}`,
        hashFunction: parseInt(`0x${multihash.slice(1, 2).toString('hex')}`, 16),
        hashSize: parseInt(`0x${multihash.slice(0, 1).toString('hex')}`, 16)
    };
};
exports.cidToMultihash = cidToMultihash;
