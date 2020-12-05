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
exports.web3 = new web3_1.default(typeof window !== "undefined"
    ? ("ethereum" in window
        ? window.ethereum
        : "Web3" in window
            ? window.Web3.currentProvider
            : web3_1.default.givenProvider)
    : web3_1.default.givenProvider);
exports.EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const enable = () => __awaiter(void 0, void 0, void 0, function* () { return "enable" in exports.web3.currentProvider && exports.web3.currentProvider.enable(); });
exports.enable = enable;
exports.enable();
const getAccount = () => __awaiter(void 0, void 0, void 0, function* () { return exports.web3.eth.getAccounts().then(accs => accs && accs[0]).catch(() => ""); });
exports.getAccount = getAccount;
