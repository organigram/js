"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.web3 = void 0;
const web3_1 = __importDefault(require("web3"));
var web3 = new web3_1.default(web3_1.default.givenProvider);
exports.web3 = web3;
