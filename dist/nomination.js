"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const procedure_1 = __importDefault(require("./procedure"));
const NominationProcedure_json_1 = __importDefault(require("@organigram/protocol/abi/NominationProcedure.json"));
class NominationProcedure extends procedure_1.default {
    static INTERFACE = '0xc5f28e49';
    contract;
    constructor(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals) {
        super(cid, address, chainId, signerOrProvider, metadata, proposers, moderators, deciders, withModeration, forwarder, proposals);
        this.contract = new ethers_1.ethers.Contract(address, NominationProcedure_json_1.default, signerOrProvider);
    }
    static async _populateInitialize(type, options, cid, proposers, moderators, deciders, _withModeration, forwarder, ..._args) {
        if (options.signer == null) {
            throw new Error('Not connected.');
        }
        const contract = new ethers_1.ethers.Contract(type, NominationProcedure_json_1.default, options.signer);
        return await contract.initialize.populateTransaction(cid, proposers, moderators, deciders, false, forwarder);
    }
    static async load(address, signerOrProvider) {
        const procedure = await procedure_1.default.load(address, signerOrProvider);
        if (!procedure)
            throw new Error('Not a valid procedure.');
        return new NominationProcedure(procedure.cid, procedure.address, procedure.chainId, signerOrProvider, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.forwarder, procedure.proposals);
    }
    async nominate(proposalKey, options) {
        const tx = await this.contract.nominate(proposalKey, {
            gasLimit: '1000000'
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, 'Initialize Nomination procedure.');
        }
        const receipt = await tx.wait();
        return receipt.status === 1;
    }
}
exports.default = NominationProcedure;
