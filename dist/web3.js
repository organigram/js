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
exports.getAccount = exports.enable = exports.EMPTY_ADDRESS = exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
const web3 = new web3_1.default(typeof window !== "undefined"
    ? ("ethereum" in window
        ? window.ethereum
        : "Web3" in window
            ? window.Web3.currentProvider
            : web3_1.default.givenProvider)
    : web3_1.default.givenProvider);
exports.web3 = web3;
const enable = () => __awaiter(void 0, void 0, void 0, function* () { return typeof web3 !== "undefined" && typeof web3.currentProvider !== "undefined" && typeof web3.currentProvider === "function" && web3.currentProvider.enable(); });
exports.enable = enable;
enable();
const getAccount = () => __awaiter(void 0, void 0, void 0, function* () { return web3.eth.getAccounts().then(accs => accs && accs[0]).catch(() => ""); });
exports.getAccount = getAccount;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
exports.EMPTY_ADDRESS = EMPTY_ADDRESS;
