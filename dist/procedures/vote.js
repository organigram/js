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
const VoteProcedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/VoteProcedure.json"));
const web3_1 = require("../web3");
const ipfs_1 = require("../ipfs");
const procedure_1 = __importDefault(require("../procedure"));
const web3_2 = __importDefault(require("web3"));
class ProcedureVote extends procedure_1.default {
    constructor(address, metadata, proposers, moderators, deciders, withModeration, proposals, quorumSize, voteDuration, majoritySize, ballots) {
        super(address, metadata, proposers, moderators, deciders, withModeration, proposals);
        this.contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
        this.quorumSize = quorumSize;
        this.voteDuration = voteDuration;
        this.majoritySize = majoritySize;
        this.ballots = ballots;
    }
    static initialize(address, metadata, proposers, moderators, deciders, withModeration, quorumSize, voteDuration, majoritySize) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
            const from = yield web3_1.getAccount();
            const multihash = ipfs_1.cidToMultihash(metadata);
            if (!multihash)
                throw new Error("Wrong CID.");
            yield contract.methods.initialize(address, multihash, proposers, moderators, deciders, withModeration, quorumSize, voteDuration, majoritySize)
                .send({ from });
        });
    }
    static loadBallot(address, proposalKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
            const ballot = yield contract.methods.getBallot(proposalKey).call();
            if (!ballot.start)
                throw new Error("Ballot not found.");
            return {
                proposalKey,
                start: ballot.start.toString(),
                votesCount: ballot.votesCount.toString(),
                hasVoted: ballot.hasVoted
            };
        });
    }
    static loadBallots(address) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield procedure_1.default.loadData(address);
            const proposalsLength = web3_2.default.utils.toBN(data.proposalsLength);
            let ballots = [];
            const iGenerator = function* () {
                let i = web3_2.default.utils.toBN("0");
                while (i.lt(proposalsLength)) {
                    yield i;
                    i = i.addn(1);
                }
            };
            try {
                for (var _b = __asyncValues(iGenerator()), _c; _c = yield _b.next(), !_c.done;) {
                    let proposalKey = _c.value;
                    const key = proposalKey.toString();
                    const ballot = yield ProcedureVote.loadBallot(address, key)
                        .catch((error) => {
                        console.warn("Error while loading ballot in vote procedure.", address, key, error.message);
                        return null;
                    });
                    if (ballot)
                        ballots.push(ballot);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return ballots;
        });
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const procedure = yield procedure_1.default.load(address);
            if (!procedure)
                throw new Error("Not a valid procedure.");
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
            const quorumSize = yield contract.methods.quorumSize().call();
            const voteDuration = yield contract.methods.voteDuration().call();
            const majoritySize = yield contract.methods.majoritySize().call();
            const ballots = yield ProcedureVote.loadBallots(address);
            return new ProcedureVote(procedure.address, procedure.metadata, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.proposals, quorumSize.toString(), voteDuration.toString(), majoritySize.toString(), ballots);
        });
    }
    vote(proposalKey, approval) {
        const _super = Object.create(null, {
            address: { get: () => super.address }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return from && this.contract.methods.vote(proposalKey, approval).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while voting.", _super.address, proposalKey, error.message);
                return false;
            });
        });
    }
    count(proposalKey) {
        const _super = Object.create(null, {
            address: { get: () => super.address }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return from && this.contract.methods.count(proposalKey).call({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while voting.", _super.address, proposalKey, error.message);
                return false;
            });
        });
    }
}
exports.default = ProcedureVote;
ProcedureVote.INTERFACE = `0xc9d27afe`;
