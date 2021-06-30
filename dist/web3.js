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
exports._linkBytecode = exports.getNetworkName = exports.getNetwork = exports.getAccount = exports.connect = exports.ecRecover = exports.sign = exports.EMPTY_ADDRESS = exports.web3 = exports.Web3 = void 0;
const web3_1 = __importDefault(require("web3"));
exports.Web3 = web3_1.default;
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
const _linkBytecode = (bytecode, links) => __awaiter(void 0, void 0, void 0, function* () {
    links.forEach(({ library, address }) => {
        const regex = new RegExp(`__${library}_+`, "g");
        bytecode = bytecode.replace(regex, address.replace("0x", ""));
    });
    return bytecode;
});
exports._linkBytecode = _linkBytecode;
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
