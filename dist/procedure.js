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
const Procedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Procedure.json"));
const web3_1 = require("./web3");
const ipfs_1 = require("./ipfs");
const web3_2 = __importDefault(require("web3"));
class Procedure {
    constructor(address, metadata, proposers, moderators, deciders, withModeration, proposals) {
        this.address = address;
        this._contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
        this.metadata = metadata;
        this.proposers = proposers;
        this.moderators = moderators;
        this.deciders = deciders;
        this.withModeration = withModeration;
        this.proposals = proposals || [];
    }
    static initialize(_address, _metadata, _proposers, _moderators, _deciders, _withModeration, ..._args) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Procedure cannot be initialized.");
        });
    }
    static loadData(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
            const data = yield contract.methods.getProcedure().call();
            const metadata = ipfs_1.multihashToCid(data.metadata);
            return {
                metadata,
                proposers: data.proposers,
                moderators: data.moderators,
                deciders: data.deciders,
                withModeration: data.withModeration,
                proposalsLength: data.proposalsLength
            };
        });
    }
    static loadProposal(address, proposalKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
            const proposal = yield contract.methods.getProposal(proposalKey).call();
            const metadata = { cid: ipfs_1.multihashToCid(proposal.metadata) };
            const blockReason = { cid: ipfs_1.multihashToCid(proposal.blockReason) };
            const operations = proposal.operations.map((op) => Procedure.parseOperation(op));
            return {
                key: proposalKey,
                creator: proposal.creator,
                metadata,
                blockReason,
                presented: proposal.presented,
                blocked: proposal.blocked,
                adopted: proposal.adopted,
                applied: proposal.applied,
                operations
            };
        });
    }
    static loadProposals(address) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Procedure.loadData(address);
            const proposalsLength = web3_2.default.utils.toBN(data.proposalsLength);
            let proposals = [];
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
                    const proposal = yield Procedure.loadProposal(address, key)
                        .catch((error) => {
                        console.warn("Error while loading proposal in procedure.", address, key, error.message);
                        return null;
                    });
                    if (proposal)
                        proposals.push(proposal);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return proposals;
        });
    }
    static load(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const isProcedure = yield Procedure.isProcedure(address).catch(() => false);
            if (!isProcedure)
                throw new Error("Contract at address is not a Procedure.");
            const data = yield Procedure.loadData(address);
            const metadata = { cid: data === null || data === void 0 ? void 0 : data.metadata };
            const proposals = yield Procedure.loadProposals(address);
            return new Procedure(address, metadata, data.proposers, data.moderators, data.deciders, data.withModeration, proposals);
        });
    }
    static _stringifyParamType(type) {
        switch (type) {
            case 'metadata': return "(bytes32,uint8,uint8)";
            case 'index': return "uint256";
            case 'indexes': return "uint256[]";
            case 'permissions': return "bytes2";
            case 'addresses': return "address[]";
            case 'address': return "address";
            case 'organ': return "address";
            case 'procedure': return "address";
            case 'proposal': return "uint256";
            case 'proposals': return "uint256";
            case 'entry': return "(address,(bytes32,uint8,uint8))";
            case 'entries': return "(address,(bytes32,uint8,uint8))[]";
            default: return "";
        }
    }
    static _extractParams(types, operation) {
        if (operation && operation.data) {
            const typesArray = types.map(Procedure._stringifyParamType);
            const decodedParams = web3_1.web3.eth.abi.decodeParameters(typesArray, `0x${operation.data.substr(10)}`);
            return types.map((type, index) => {
                let param = {
                    type,
                    value: decodedParams[index]
                };
                switch (param.type) {
                    case 'metadata':
                        param.value = ipfs_1.multihashToCid({
                            ipfsHash: param.value[0],
                            hashFunction: param.value[1],
                            hashSize: param.value[2]
                        });
                        break;
                    case 'entry':
                        param.value = {
                            addr: param.value[0],
                            doc: ipfs_1.multihashToCid({
                                ipfsHash: param.value[1][0],
                                hashFunction: param.value[1][1],
                                hashSize: param.value[1][2]
                            })
                        };
                        break;
                    case 'entries':
                        param.value = param.value.map((e) => ({
                            addr: e[0],
                            doc: ipfs_1.multihashToCid({
                                ipfsHash: e[1][0],
                                hashFunction: e[1][1],
                                hashSize: e[1][2]
                            })
                        }));
                        break;
                    default:
                }
                return param;
            });
        }
        else {
            return types.map(type => ({ type }));
        }
    }
    static parseOperation(_operation) {
        const [index, organ, data, value, processed] = _operation;
        const functionSelector = data.toString().slice(0, 10);
        let operation = { index, organ, value, data, processed, functionSelector };
        operation.function = Procedure.OPERATIONS_FUNCTIONS.find(pof => pof.funcSig === functionSelector);
        if (!operation.function)
            return operation;
        operation.params = operation.function.params && Procedure._extractParams(operation.function.params, operation);
        return operation;
    }
    static isProcedure(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
            const isERC165 = yield contract.methods.supportsInterface("0x01ffc9a7").call()
                .catch(() => false);
            if (!isERC165)
                return false;
            const isProcedure = yield contract.methods.supportsInterface(Procedure.INTERFACE).call()
                .catch(() => false);
            return isProcedure;
        });
    }
    updateMetadata(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error("Wrong CID.");
            const from = yield web3_1.getAccount();
            return from && this._contract.methods.updateMetadata(multihash).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while updating metadata.", this.address, error.message);
                return false;
            });
        });
    }
    updateAdmin(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return from && this._contract.methods.updateAdmin(address).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while updating admin.", this.address, error.message);
                return false;
            });
        });
    }
    propose(metadata, operations) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            const multihash = ipfs_1.cidToMultihash(metadata);
            if (!multihash)
                throw new Error("Wrong CID.");
            const ops = operations.map(operation => {
                return {
                    index: operation.index || "0",
                    organ: operation.organ,
                    data: operation.data,
                    value: operation.value,
                    processed: false
                };
            });
            const proposalKey = yield this._contract.methods.propose(multihash, ops).send({ from });
            if (!proposalKey)
                throw new Error("Proposal not created.");
            const proposal = yield Procedure.loadProposal(this.address, proposalKey);
            if (!proposal)
                throw new Error("Proposal not found.");
            this.proposals.push(proposal);
            return proposal;
        });
    }
    blockProposal(proposalKey, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            const multihash = ipfs_1.cidToMultihash(reason);
            if (!multihash)
                throw new Error("Wrong CID.");
            return this._contract.methods.blockProposal(proposalKey, multihash).send({ from });
        });
    }
    presentProposal(proposalKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return from && this._contract.methods.presentProposal(proposalKey).send({ from })
                .catch((error) => {
                console.error("Error while presenting proposal.", this.address, proposalKey, error.message);
                return false;
            });
        });
    }
    applyProposal(proposalKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const from = yield web3_1.getAccount();
            return this._contract.methods.presentProposal(proposalKey).send({ from });
        });
    }
    reloadProposals() {
        return __awaiter(this, void 0, void 0, function* () {
            const proposals = yield Procedure.loadProposals(this.address);
            this.proposals = proposals;
            return this;
        });
    }
    reloadProposal(proposalKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const proposal = yield Procedure.loadProposal(this.address, proposalKey);
            const proposals = this.proposals.map(m => m.key === proposalKey ? proposal : m);
            this.proposals = proposals;
            return this;
        });
    }
    reloadData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Procedure.loadData(this.address);
            this.metadata.cid = data.metadata;
            this.proposers = data.proposers;
            this.moderators = data.moderators;
            this.deciders = data.deciders;
            this.withModeration = data.withModeration;
            return this;
        });
    }
}
exports.default = Procedure;
Procedure.INTERFACE = `0x71dbd330`;
Procedure.OPERATIONS_PARAMS_TYPES = [
    "metadata",
    "index",
    "indexes",
    "permissions",
    "addresses",
    "address",
    "organ",
    "procedure",
    "proposal",
    "proposals",
    "entry",
    "entries"
];
Procedure.OPERATIONS_FUNCTIONS = [
    {
        funcSig: "0x4d3f8407",
        key: "updateMetadata",
        signature: "updateMetadata(CoreLibrary.Metadata)",
        label: "Update metadata",
        tags: ["metadata", "replace"],
        params: ['metadata'],
        target: 'organ'
    },
    {
        funcSig: "0xbbc56af9",
        key: "addEntries",
        signature: "addEntries(OrganLibrary.Entry[])",
        label: "Add entries",
        tags: ["entries", "add"],
        params: ['entries'],
        target: 'organ'
    },
    {
        funcSig: "0x7615eb81",
        key: "removeEntries",
        signature: "removeEntries(uint256[])",
        label: "Remove entries",
        tags: ["entries", "remove"],
        params: ['indexes'],
        target: 'organ'
    },
    {
        funcSig: "0x91bdfe63",
        key: "replaceEntry",
        signature: "replaceEntry(uint256,CoreLibrary.Entry)",
        label: "Replace entry",
        tags: ["entries", "replace"],
        params: ['index', 'entry'],
        target: 'organ'
    },
    {
        funcSig: "0x7f0a4e27",
        key: "addProcedure",
        signature: "addProcedure(address,bytes2)",
        label: "Add procedure",
        tags: ["procedures", "add"],
        params: ['procedure', 'permissions'],
        target: 'organ'
    },
    {
        funcSig: "0x19b9404c",
        key: "removeProcedure",
        signature: "removeProcedure(address)",
        label: "Remove procedure",
        tags: ["procedures", "remove"],
        params: ['procedure'],
        target: 'organ'
    },
    {
        funcSig: "0xd0922d4a",
        key: "replaceProcedure",
        signature: "replaceProcedure(address,address,bytes2)",
        label: "Replace procedure",
        tags: ["procedures", "replace"],
        params: ['procedure', 'procedure', 'permissions'],
        target: 'organ'
    }
];
