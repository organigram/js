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
exports.ProcedureVote = exports.INTERFACE = void 0;
const web3_1 = require("../web3");
const VoteProcedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/VoteProcedure.json"));
const ipfs_1 = require("../ipfs");
const _1 = __importDefault(require("."));
exports.INTERFACE = `0xc9d27afe`;
class ProcedureVote {
    constructor({ address, votersOrgan, vetoersOrgan, enactorsOrgan, propositions }) {
        this.propositions = [];
        this.propose = (moveKey, cid, quorumSize, voteDuration, enactmentDuration, majoritySize) => __awaiter(this, void 0, void 0, function* () {
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, this._address);
            const from = yield web3_1.getAccount();
            return contract.methods.propose(moveKey, ipfsHash, hashFunction, hashSize, quorumSize, voteDuration, enactmentDuration, majoritySize)
                .send({ from });
        });
        this.vote = (moveKey, approval) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, this._address);
            const from = yield web3_1.getAccount();
            return contract.methods.vote(moveKey, approval)
                .send({ from });
        });
        this.veto = (moveKey, cid) => __awaiter(this, void 0, void 0, function* () {
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, this._address);
            const from = yield web3_1.getAccount();
            return contract.methods.veto(moveKey, ipfsHash, hashFunction, hashSize)
                .send({ from });
        });
        this.count = (moveKey) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, this._address);
            return contract.methods.count(moveKey).call();
        });
        this.enact = (moveKey) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, this._address);
            const from = yield web3_1.getAccount();
            return contract.methods.enact(moveKey)
                .send({ from });
        });
        this._address = address;
        this.votersOrgan = votersOrgan;
        this.vetoersOrgan = vetoersOrgan;
        this.enactorsOrgan = enactorsOrgan;
        this.propositions = propositions;
    }
    static deploy(cid, voters, vetoers, enactors) {
        return __awaiter(this, void 0, void 0, function* () {
            const multihash = ipfs_1.cidToMultihash(`${cid}`);
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const network = yield web3_1.getNetwork();
            const libraries = yield web3_1.getLibraries(network);
            if (!libraries.procedure[0] || !libraries.procedure[0].address)
                throw new Error("Procedure library not found.");
            if (!libraries.voteProposition[0] || !libraries.voteProposition[0].address)
                throw new Error("VoteProposition library not found.");
            const links = [
                Object.assign(Object.assign({}, libraries.procedure[0]), { library: "ProcedureLibrary" }),
                Object.assign(Object.assign({}, libraries.voteProposition[0]), { library: "VotePropositionLibrary" })
            ];
            const from = yield web3_1.getAccount();
            const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi);
            return contract.deploy({
                data: yield web3_1._linkBytecode(VoteProcedure_json_1.default.bytecode, links),
                arguments: [ipfsHash, hashFunction, hashSize, voters, vetoers, enactors]
            })
                .send({ from })
                .then(contract => {
                return _1.default.load(contract.options.address);
            });
        });
    }
}
exports.ProcedureVote = ProcedureVote;
ProcedureVote.load = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    const votersOrgan = yield contract.methods.votersOrgan().call()
        .catch((error) => {
        console.warn("Error while loading voters organ address in vote procedure.", address, error.message);
        return "";
    });
    const vetoersOrgan = yield contract.methods.vetoersOrgan().call()
        .catch((error) => {
        console.warn("Error while loading vetoers organ address in vote procedure.", address, error.message);
        return "";
    });
    const enactorsOrgan = yield contract.methods.enactorsOrgan().call()
        .catch((error) => {
        console.warn("Error while loading enactors organ address in vote procedure.", address, error.message);
        return "";
    });
    const propositions = yield ProcedureVote.loadPropositions(address);
    return new ProcedureVote({ address, votersOrgan, vetoersOrgan, enactorsOrgan, propositions });
});
ProcedureVote.loadPropositions = (address) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    let propositions = [];
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    const movesLength = yield contract.methods.getMovesLength().call().then(parseInt)
        .catch((error) => {
        console.warn("Error while loading moves length in procedure.", address, error.message);
        return 0;
    });
    const iGenerator = function* () {
        let i = 0;
        while (i < movesLength)
            yield i++;
    };
    try {
        for (var _b = __asyncValues(iGenerator()), _c; _c = yield _b.next(), !_c.done;) {
            let moveKey = _c.value;
            const key = `${moveKey}`;
            const proposition = yield ProcedureVote.loadProposition(address, key)
                .catch((error) => {
                console.warn("Error while loading proposition in vote procedure.", address, moveKey, error.message);
                return null;
            });
            if (proposition) {
                const metadata = yield ProcedureVote.loadPropositionMetadata(address, key);
                const vetoMetadata = yield ProcedureVote.loadPropositionVetoMetadata(address, key);
                propositions.push(Object.assign(Object.assign({}, proposition), { metadata,
                    vetoMetadata }));
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return propositions;
});
ProcedureVote.loadProposition = (address, moveKey) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    return contract.methods.getProposition(moveKey).call()
        .then((res) => __awaiter(void 0, void 0, void 0, function* () {
        let proposition = {
            moveKey,
            creator: res[0],
            quorumSize: res[1],
            voteDuration: res[2],
            enactmentDuration: res[3],
            majoritySize: res[4],
            vetoer: res[5],
            enactor: res[6]
        };
        if (proposition.creator === web3_1.EMPTY_ADDRESS)
            return null;
        proposition.metadata = yield ProcedureVote.loadPropositionMetadata(address, moveKey).catch(() => null);
        proposition.vetoMetadata = yield ProcedureVote.loadPropositionVetoMetadata(address, moveKey).catch(() => null);
        return proposition;
    }));
});
ProcedureVote.loadPropositionMetadata = (address, moveKey) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    return contract.methods.getPropositionMetadata(moveKey).call()
        .then((multihash) => ipfs_1.multihashToCid(multihash));
});
ProcedureVote.loadPropositionVetoMetadata = (address, moveKey) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(VoteProcedure_json_1.default.abi, address);
    return contract.methods.getPropositionVetoMetadata(moveKey).call()
        .then((multihash) => ipfs_1.multihashToCid(multihash));
});
exports.default = ProcedureVote;
