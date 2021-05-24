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
exports._linkBytecode = exports._saveLocalLibrary = exports.hasLibraries = exports.deployMissingLibraries = exports.getLibraryArtefact = exports.getLibraries = exports.getLocalLibraries = exports.getNetworkName = exports.getNetwork = exports.getAccount = exports.connect = exports.ecRecover = exports.sign = exports.EMPTY_ADDRESS = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
exports.EMPTY_ADDRESS = EMPTY_ADDRESS;
const web3 = new web3_1.default(typeof window !== "undefined"
    ? ("ethereum" in window
        ? window.ethereum
        : "Web3" in window
            ? window.Web3.currentProvider
            : web3_1.default.givenProvider)
    : web3_1.default.givenProvider);
exports.web3 = web3;
const getAccount = () => __awaiter(void 0, void 0, void 0, function* () { return web3.eth.getAccounts().then(accs => accs && accs[0] && accs[0].toLowerCase()); });
exports.getAccount = getAccount;
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    return typeof web3.eth.requestAccounts === "function"
        ? web3.eth.requestAccounts().catch(() => ['']).then(accs => accs && accs[0] && accs[0].toLowerCase())
        : getAccount();
});
exports.connect = connect;
const getNetwork = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!web3 || !web3.currentProvider)
        throw new Error("Web3 is missing.");
    const chainId = yield web3.eth.getChainId();
    if (!chainId)
        throw new Error("Web3 network not found.");
    switch (chainId) {
        case 1: return 'mainnet';
        case 2: return 'morden';
        case 3: return 'ropsten';
        case 4: return 'rinkeby';
        case 5: return 'goerli';
        case 42: return 'kovan';
        case 100: return 'xdai';
        case 1337: return 'dev';
        case 1001: return 'organigr.am';
        default: return 'private';
    }
});
exports.getNetwork = getNetwork;
const getNetworkName = (network) => {
    switch (network) {
        case 'rinkeby': return "Rinkeby Ethereum Test Network";
        case 'mainnet': return "Ethereum Main Network";
        case 'morden': return "Morden Ethereum Test Network";
        case 'ropsten': return "Ropsten Ethereum Test Network";
        case 'kovan': return "Kovan Ethereum Test Network";
        case 'goerli': return "Görli Ethereum Test Network";
        case 'organigr.am': return "Organigr.am Network";
        case 'dev': return "Dev Network";
        case 'private': return "a private Ethereum Network";
        default: return "a blockchain";
    }
};
exports.getNetworkName = getNetworkName;
const getLocalLibraries = () => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof window === "undefined" || !window.localStorage)
        throw new Error("Cannot query local libraries outside a browser.");
    let libraries = yield window.localStorage.getItem('organigram-libraries');
    libraries = JSON.parse(libraries) || libraries;
    return !libraries
        ? { organ: [], procedure: [], voteProposition: [] }
        : {
            organ: libraries.organ.map((l) => ({ network: l.network || "", address: l.address || "" })),
            procedure: libraries.procedure.map((l) => ({ network: l.network || "", address: l.address || "" })),
            voteProposition: libraries.voteProposition.map((l) => ({ network: l.network || "", address: l.address || "" })),
        };
});
exports.getLocalLibraries = getLocalLibraries;
const getLibraries = (network) => __awaiter(void 0, void 0, void 0, function* () {
    let libraries = {
        organ: [
            { network: 'rinkeby', address: '0x0C80740ce3efB987345c851E6E95508f3f900cD0' }
        ],
        procedure: [
            { network: 'rinkeby', address: '0x3749f184af336dBBd819E5C4425E1BDB97DeD01a' }
        ],
        voteProposition: [
            { network: 'rinkeby', address: '0x69F246Cfe4D41496CD83C075147Ae3F88A6a7Ff6' }
        ]
    };
    const localLibraries = yield getLocalLibraries();
    libraries = {
        organ: [...libraries.organ, ...localLibraries.organ],
        procedure: [...libraries.procedure, ...localLibraries.procedure],
        voteProposition: [...libraries.voteProposition, ...localLibraries.voteProposition],
    };
    return !network
        ? libraries
        : {
            organ: libraries.organ.filter(l => l.network === network),
            procedure: libraries.procedure.filter(l => l.network === network),
            voteProposition: libraries.voteProposition.filter(l => l.network === network)
        };
});
exports.getLibraries = getLibraries;
const _saveLocalLibrary = (key, network, address) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof window === "undefined" || !window.localStorage)
        throw new Error("Cannot query local libraries outside a browser.");
    let libraries = yield getLocalLibraries();
    if (libraries[key].find((l) => l.network === network))
        libraries[key].map((l) => l.network === network ? Object.assign(Object.assign({}, l), { address }) : l);
    else
        libraries[key].push({ network, address });
    window.localStorage.setItem('organigram-libraries', JSON.stringify(libraries));
    return libraries;
});
exports._saveLocalLibrary = _saveLocalLibrary;
const getLibraryArtefact = (key) => __awaiter(void 0, void 0, void 0, function* () {
    switch (key) {
        case 'organ':
            return Promise.resolve().then(() => __importStar(require('@organigram/contracts/build/contracts/OrganLibrary.json')));
        case 'procedure':
            return Promise.resolve().then(() => __importStar(require('@organigram/contracts/build/contracts/ProcedureLibrary.json')));
        case 'voteProposition':
            return Promise.resolve().then(() => __importStar(require('@organigram/contracts/build/contracts/VotePropositionLibrary.json')));
        default:
            throw new Error("Wrong library key.");
    }
});
exports.getLibraryArtefact = getLibraryArtefact;
const deployMissingLibraries = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    if (!web3)
        throw new Error("Web3 is missing.");
    const network = yield getNetwork();
    const from = yield getAccount();
    let libraries = yield getLibraries(network);
    const keys = ["organ", "procedure", "voteProposition"];
    try {
        for (var keys_1 = __asyncValues(keys), keys_1_1; keys_1_1 = yield keys_1.next(), !keys_1_1.done;) {
            var key = keys_1_1.value;
            if (!libraries[key].find(l => l.network === network && !!l.address)) {
                const libraryArtefact = yield getLibraryArtefact(key);
                const libraryContract = new web3.eth.Contract(libraryArtefact.abi);
                const libraryInstance = yield libraryContract.deploy({ data: libraryArtefact.bytecode })
                    .send({ from })
                    .catch(error => {
                    console.error("Error while deploying missing library.", key, error.message);
                });
                if (libraryInstance && libraryInstance.options && libraryInstance.options.address) {
                    yield _saveLocalLibrary(key, network, libraryInstance.options.address);
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) yield _a.call(keys_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return yield getLibraries(network).then(data => { console.info(data); return data; });
});
exports.deployMissingLibraries = deployMissingLibraries;
const _linkBytecode = (bytecode, links) => __awaiter(void 0, void 0, void 0, function* () {
    links.forEach(({ library, address }) => {
        const regex = new RegExp(`__${library}_+`, "g");
        bytecode = bytecode.replace(regex, address.replace("0x", ""));
    });
    return bytecode;
});
exports._linkBytecode = _linkBytecode;
const hasLibraries = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const network = yield getNetwork();
        const libraries = yield getLibraries(network);
        const keys = ['organ', 'procedure', 'voteProposition'];
        return keys.map(key => {
            const link = libraries[key].find(l => l.network === network && l.address);
            return !!link && !!link.address;
        }).reduce((prev, current) => prev && current, true);
    }
    catch (error) {
        return false;
    }
});
exports.hasLibraries = hasLibraries;
const sign = (message, password = "") => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield getAccount();
    return account && web3 && web3.eth && web3.eth.personal && web3.eth.personal.sign
        ? web3.eth.personal.sign(message, account, password)
        : null;
});
exports.sign = sign;
const ecRecover = (message, signature) => __awaiter(void 0, void 0, void 0, function* () {
    return web3 && web3.eth && web3.eth.personal && web3.eth.personal.ecRecover
        ? web3.eth.personal.ecRecover(message, signature).then(a => a.toLowerCase())
        : null;
});
exports.ecRecover = ecRecover;
