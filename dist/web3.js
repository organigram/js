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
exports._linkBytecode = exports.getNetworkName = exports.getNetwork = exports.getAccount = exports.connect = exports.ecRecover = exports.sign = exports.EMPTY_ADDRESS = exports.web3 = exports.Web3 = void 0;
var web3_1 = require("web3");
exports.Web3 = web3_1["default"];
var EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
exports.EMPTY_ADDRESS = EMPTY_ADDRESS;
var web3 = new web3_1["default"](typeof window !== "undefined"
    ? ("ethereum" in window
        ? window.ethereum
        : "Web3" in window
            ? window.Web3.currentProvider
            : web3_1["default"].givenProvider)
    : web3_1["default"].givenProvider);
exports.web3 = web3;
var getAccount = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2, web3.eth.getAccounts().then(function (accs) { return accs && accs[0] && accs[0].toLowerCase(); })];
}); }); };
exports.getAccount = getAccount;
var connect = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, typeof web3.eth.requestAccounts === "function"
                ? web3.eth.requestAccounts()["catch"](function () { return ['']; }).then(function (accs) { return accs && accs[0] && accs[0].toLowerCase(); })
                : getAccount()];
    });
}); };
exports.connect = connect;
var getNetwork = function () { return __awaiter(void 0, void 0, void 0, function () {
    var chainId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!web3 || !web3.currentProvider)
                    throw new Error("Web3 is missing.");
                return [4, web3.eth.getChainId()];
            case 1:
                chainId = _a.sent();
                if (!chainId)
                    throw new Error("Web3 network not found.");
                switch (chainId) {
                    case 1: return [2, 'mainnet'];
                    case 2: return [2, 'morden'];
                    case 3: return [2, 'ropsten'];
                    case 4: return [2, 'rinkeby'];
                    case 5: return [2, 'goerli'];
                    case 42: return [2, 'kovan'];
                    case 100: return [2, 'xdai'];
                    case 1337: return [2, 'dev'];
                    case 5777: return [2, 'truffle'];
                    case 1001: return [2, 'organigr.am'];
                    default: return [2, 'private'];
                }
                return [2];
        }
    });
}); };
exports.getNetwork = getNetwork;
var getNetworkName = function (network) {
    switch (network) {
        case 'rinkeby': return "Rinkeby Ethereum Test Network";
        case 'mainnet': return "Ethereum Main Network";
        case 'morden': return "Morden Ethereum Test Network";
        case 'ropsten': return "Ropsten Ethereum Test Network";
        case 'kovan': return "Kovan Ethereum Test Network";
        case 'goerli': return "Görli Ethereum Test Network";
        case 'organigr.am': return "Organigr.am Network";
        case 'dev': return "Dev Network";
        case 'truffle': return "a local Ethereum Network";
        case 'private': return "a private Ethereum Network";
        default: return "a blockchain";
    }
};
exports.getNetworkName = getNetworkName;
var _linkBytecode = function (bytecode, links) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        links.forEach(function (_a) {
            var library = _a.library, address = _a.address;
            var regex = new RegExp("__" + library + "_+", "g");
            bytecode = bytecode.replace(regex, address.replace("0x", ""));
        });
        return [2, bytecode];
    });
}); };
exports._linkBytecode = _linkBytecode;
var sign = function (message, password) {
    if (password === void 0) { password = ""; }
    return __awaiter(void 0, void 0, void 0, function () {
        var account;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getAccount()];
                case 1:
                    account = _a.sent();
                    return [2, account && web3 && web3.eth && web3.eth.personal && web3.eth.personal.sign
                            ? web3.eth.personal.sign(message, account, password)
                            : null];
            }
        });
    });
};
exports.sign = sign;
var ecRecover = function (message, signature) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, web3 && web3.eth && web3.eth.personal && web3.eth.personal.ecRecover
                ? web3.eth.personal.ecRecover(message, signature).then(function (a) { return a.toLowerCase(); })
                : null];
    });
}); };
exports.ecRecover = ecRecover;
