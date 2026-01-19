"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployERC20 = exports.getAssetData = void 0;
const ExampleCoin_json_1 = __importDefault(require("@organigram/protocol/build/contracts/ExampleCoin.json"));
const ethers_1 = require("ethers");
const ERC20_INITIAL_SUPPLY = '10000000000000000000000000';
const getAssetData = async (assetAddress, signer) => {
    if (assetAddress == null || assetAddress === '' || signer == null) {
        return undefined;
    }
    const erc777Interface = new ethers_1.Interface(ExampleCoin_json_1.default.abi);
    const contract = new ethers_1.ethers.Contract(assetAddress, erc777Interface, signer);
    const name = await contract.name();
    const symbol = await contract.symbol();
    const _totalSupply = await contract.totalSupply();
    let totalSupply = (0, ethers_1.formatEther)(_totalSupply);
    totalSupply = (+totalSupply).toFixed(0);
    const _userBalance = await contract.balanceOf(signer.getAddress());
    let userBalance = (0, ethers_1.formatEther)(_userBalance);
    userBalance = (+userBalance).toFixed(0);
    if (contract != null) {
        return { contract, name, symbol, totalSupply, userBalance };
    }
};
exports.getAssetData = getAssetData;
const deployERC20 = async (signer) => {
    const erc777Interface = new ethers_1.ethers.Interface(ExampleCoin_json_1.default.abi);
    const factory = new ethers_1.ethers.ContractFactory(erc777Interface, ExampleCoin_json_1.default.bytecode, signer);
    const contract = await factory.deploy(BigInt(ERC20_INITIAL_SUPPLY));
    await contract.waitForDeployment();
    return contract;
};
exports.deployERC20 = deployERC20;
