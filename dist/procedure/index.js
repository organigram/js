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
exports.Procedure = exports.INTERFACE = void 0;
const ipfs_core_1 = require("ipfs-core");
const Procedure_json_1 = __importDefault(require("@organigram/contracts/build/contracts/Procedure.json"));
const web3_1 = require("../web3");
const ipfs_1 = require("../ipfs");
const web3_2 = require("../web3");
exports.INTERFACE = `0x71dbd330`;
class Procedure {
    constructor({ address, type, ProcedureClass, metadata, data, moves }) {
        this.address = "";
        this.type = "";
        this.ProcedureClass = "";
        this.metadata = {};
        this.data = null;
        this.moves = [];
        this.createMove = (cid = new ipfs_core_1.CID("QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH")) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const from = yield web3_2.getAccount();
            return from && contract.methods.createMove(ipfsHash, hashFunction, hashSize).send({ from });
        });
        this.lockMove = (moveKey) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.lockMove(moveKey).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while locking move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.updateMetadata = (cid = new ipfs_core_1.CID("QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH")) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const multihash = ipfs_1.cidToMultihash(cid);
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const from = yield web3_2.getAccount();
            return from && contract.methods.updateMetadata(ipfsHash, hashFunction, hashSize).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while updating metadata.", this.address, error.message);
                return false;
            });
        });
        this.updateAdmin = (address) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.updateAdmin(address).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while updating admin.", this.address, error.message);
                return false;
            });
        });
        this.moveAddEntries = (moveKey, organ, entries, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            const _entries = entries.map(e => {
                let multihash = null;
                if (e.cid) {
                    try {
                        multihash = ipfs_1.cidToMultihash(new ipfs_core_1.CID(e.cid));
                    }
                    catch (error) {
                        console.error("Unable to find a CID for this entry.", error.message);
                    }
                }
                if (!multihash)
                    multihash = ipfs_1.cidToMultihash(new ipfs_core_1.CID(ipfs_1.EMPTY_CID));
                return Object.assign({ addr: e.address }, multihash);
            }).filter(e => !!e);
            return from && contract.methods.moveAddEntries(moveKey, organ, _entries, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while adding entries in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveRemoveEntries = (moveKey, organ, indexes, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.moveRemoveEntries(moveKey, organ, indexes, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while removing entry in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveReplaceEntry = (moveKey, organ, entry, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            let multihash = entry.cid && ipfs_core_1.CID.isCID(entry.cid)
                ? ipfs_1.cidToMultihash(new ipfs_core_1.CID(entry.cid))
                : ipfs_1.cidToMultihash(new ipfs_core_1.CID(ipfs_1.EMPTY_CID));
            if (!multihash)
                throw new Error("Wrong CID.");
            const { ipfsHash, hashFunction, hashSize } = multihash;
            const address = entry.address || web3_1.EMPTY_ADDRESS;
            return yield contract.methods.moveReplaceEntry(moveKey, organ, entry.index, address, ipfsHash, hashFunction, hashSize, lock)
                .send({ from: web3_1.web3.eth.defaultAccount })
                .then(() => true)
                .catch((error) => {
                console.error("Error while replacing entry in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveAddProcedure = (moveKey, organ, procedure, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.moveAddProcedure(moveKey, organ, procedure.address, procedure.permissions, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while adding procedures in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveRemoveProcedure = (moveKey, organ, procedure, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.moveRemoveProcedure(moveKey, organ, procedure.address, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while removing procedure in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveReplaceProcedure = (moveKey, organ, oldProcedure, newProcedure, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.moveReplaceProcedure(moveKey, organ, oldProcedure, newProcedure.address, newProcedure.permissions, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while replacing procedure in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.moveCall = (moveKey, _call, lock = false) => __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, this.address);
            const from = yield web3_2.getAccount();
            return from && contract.methods.moveCall(moveKey, _call, lock).send({ from })
                .then(() => true)
                .catch((error) => {
                console.error("Error while adding special call in move.", this.address, moveKey, error.message);
                return false;
            });
        });
        this.reloadMoves = () => __awaiter(this, void 0, void 0, function* () {
            const moves = yield Procedure.loadMoves(this.address);
            return new Procedure({
                address: this.address,
                ProcedureClass: this.ProcedureClass,
                metadata: this.metadata,
                type: this.type,
                data: this.data,
                moves
            });
        });
        this.reloadMove = (moveKey) => __awaiter(this, void 0, void 0, function* () {
            const move = yield Procedure.loadMove(this.address, moveKey);
            const moves = this.moves.map(m => m.key === moveKey ? move : m);
            return new Procedure({
                address: this.address,
                ProcedureClass: this.ProcedureClass,
                metadata: this.metadata,
                type: this.type,
                data: this.data,
                moves
            });
        });
        this.reloadMetadata = () => __awaiter(this, void 0, void 0, function* () {
            const moves = yield Procedure.loadMoves(this.address);
            return new Procedure({
                address: this.address,
                ProcedureClass: this.ProcedureClass,
                metadata: this.metadata,
                type: this.type,
                data: this.data,
                moves
            });
        });
        this.address = address;
        this.type = type;
        this.ProcedureClass = ProcedureClass;
        this.metadata = metadata;
        this.data = data;
        this.moves = moves;
    }
    static isProcedure(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
            const isERC165 = yield contract.methods.supportsInterface("0x01ffc9a7").call()
                .catch(() => false);
            if (!isERC165)
                return false;
            const isProcedure = yield contract.methods.supportsInterface(exports.INTERFACE).call()
                .catch(() => false);
            return isProcedure;
        });
    }
    static getType(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
            const procedureType = Promise.all([
                require('./nomination').INTERFACE,
                require('./vote').INTERFACE
            ])
                .then((proceduresInterfaces) => { var proceduresInterfaces_1, proceduresInterfaces_1_1; return __awaiter(this, void 0, void 0, function* () {
                var e_1, _a;
                try {
                    for (proceduresInterfaces_1 = __asyncValues(proceduresInterfaces); proceduresInterfaces_1_1 = yield proceduresInterfaces_1.next(), !proceduresInterfaces_1_1.done;) {
                        var procedureInterface = proceduresInterfaces_1_1.value;
                        if (yield contract.methods.supportsInterface(procedureInterface).call()
                            .catch(() => false))
                            return procedureInterface;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (proceduresInterfaces_1_1 && !proceduresInterfaces_1_1.done && (_a = proceduresInterfaces_1.return)) yield _a.call(proceduresInterfaces_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return "";
            }); });
            return procedureType;
        });
    }
    static getClass(type) {
        return __awaiter(this, void 0, void 0, function* () {
            const ProcedureClass = Promise.all([
                require('./nomination'),
                require('./vote')
            ])
                .then(([{ default: Nomination, INTERFACE: NominationInterface }, { default: Vote, INTERFACE: VoteInterface }]) => __awaiter(this, void 0, void 0, function* () {
                switch (type) {
                    case NominationInterface: return Nomination;
                    case VoteInterface: return Vote;
                    default: return null;
                }
            }));
            return ProcedureClass;
        });
    }
}
exports.Procedure = Procedure;
Procedure.deploy = (type, cid, args) => __awaiter(void 0, void 0, void 0, function* () {
    let ProcedureClass = null;
    switch (type) {
        case 'nomination':
            ProcedureClass = (yield require('./nomination')).default;
            break;
        case 'vote':
            ProcedureClass = (yield require('./vote')).default;
            break;
        default:
            throw new Error("Unknown procedure type.");
    }
    return ProcedureClass && ProcedureClass.deploy(cid, ...args);
});
Procedure.load = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const isProcedure = yield Procedure.isProcedure(address).catch(() => false);
    if (!isProcedure)
        throw new Error("Contract at address is not a Procedure.");
    const type = yield Procedure.getType(address);
    const ProcedureClass = yield Procedure.getClass(type);
    const metadata = yield Procedure.loadMetadata(address).catch(() => ({}));
    const moves = yield Procedure.loadMoves(address);
    const data = ProcedureClass && "load" in ProcedureClass
        ? yield ProcedureClass.load(address)
            .catch((error) => {
            console.warn("Error while loading procedure data.", address, error.message);
            return null;
        })
        : null;
    return new Procedure({ address, type, ProcedureClass, metadata, moves, data });
});
Procedure.loadMoves = (address) => __awaiter(void 0, void 0, void 0, function* () {
    var e_2, _a;
    const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
    const movesLength = yield contract.methods.getMovesLength().call().then(parseInt)
        .catch((error) => {
        console.warn("Error while loading moves length in procedure.", address, error.message);
        return 0;
    });
    let moves = [];
    const iGenerator = function* () {
        let i = 0;
        while (i < movesLength)
            yield i++;
    };
    try {
        for (var _b = __asyncValues(iGenerator()), _c; _c = yield _b.next(), !_c.done;) {
            let moveKey = _c.value;
            const key = `${moveKey}`;
            const move = yield Procedure.loadMove(address, key)
                .catch((error) => {
                console.warn("Error while loading move in procedure.", address, moveKey, error.message);
                return null;
            });
            if (move)
                moves.push(move);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return moves;
});
Procedure.loadMove = (address, moveKey) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
    return yield contract.methods.getMove(moveKey).call()
        .then(({ creator, locked, applied, processing, metadata, operations }) => ({
        key: moveKey, creator, locked, applied, processing,
        metadata: {
            cid: metadata && metadata.ipfsHash && ipfs_1.multihashToCid(metadata)
        },
        operations
    }));
});
Procedure.loadMetadata = (address) => __awaiter(void 0, void 0, void 0, function* () {
    const contract = new web3_1.web3.eth.Contract(Procedure_json_1.default.abi, address);
    const ipfs = yield ipfs_1.ipfsNode;
    if (!ipfs) {
        console.info("IPFS was not started. Starting IPFS.");
        yield ipfs.start();
    }
    let metadata = {};
    try {
        metadata.cid = yield contract.methods.getMetadata().call()
            .then((multihash) => ipfs_1.multihashToCid(multihash));
    }
    catch (error) {
        console.warn("Error while computing IPFS Content ID for procedure metadata.", address, error.message);
    }
    if (metadata.cid) {
        try {
            metadata.data = yield ipfs_1.parseJSON(metadata.cid);
        }
        catch (error) {
            console.warn("Error while fetching metadata content for procedure.", address, error.message);
        }
    }
    return metadata;
});
exports.default = Procedure;
