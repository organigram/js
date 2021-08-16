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
exports._decryptMessagePGP = exports._encryptMessagePGP = exports.decryptFile = exports.decrypt = exports.encrypt = exports.verify = exports.sign = exports.generateKey = exports.generatePassword = exports.generateSignature = exports.deployKey = exports.openpgp = void 0;
var web3_1 = require("./web3");
var openpgp = require("openpgp");
exports.openpgp = openpgp;
var deployKey = function (key, keyserver) {
    return Promise.reject(new Error("Not implemented"));
};
exports.deployKey = deployKey;
var sign = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var account;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, web3_1.getAccount()];
            case 1:
                account = _a.sent();
                if (!account)
                    throw new Error("No wallet found.");
                return [2, web3_1.web3.eth.personal.sign(message, account, "")];
        }
    });
}); };
exports.sign = sign;
var verify = function (message, signature, account) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (!account)
            throw new Error("No wallet found.");
        account = account.toLowerCase();
        return [2, web3_1.ecRecover(message, signature)
                .then(function (a) { return Boolean(a && a === account); })["catch"](function () { return false; })];
    });
}); };
exports.verify = verify;
var encrypt = function (data) {
    return Promise.reject(new Error("Not implemented"));
};
exports.encrypt = encrypt;
var decrypt = function (data) {
    return Promise.reject(new Error("Not implemented"));
};
exports.decrypt = decrypt;
var decryptFile = function (cipherdata, passphrase) {
    return Promise.reject(new Error("Not implemented"));
};
exports.decryptFile = decryptFile;
var generateSignature = function () { return __awaiter(void 0, void 0, void 0, function () {
    var account, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, web3_1.getAccount().then(function (a) { return a.toLowerCase(); })];
            case 1:
                account = _a.sent();
                if (!account)
                    throw new Error("No wallet found.");
                message = "Generating Organigr.am Vault keys for " + account + "...";
                return [2, sign(message)];
        }
    });
}); };
exports.generateSignature = generateSignature;
var generatePassword = function () { return __awaiter(void 0, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
    switch (_c.label) {
        case 0:
            _b = (_a = Buffer).from;
            return [4, openpgp.RandomBuffer.getRandomBytes(44)];
        case 1: return [2, _b.apply(_a, [_c.sent()]).toString('hex')];
    }
}); }); };
exports.generatePassword = generatePassword;
var generateKey = function (passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var account, _a, privateKey, publicKey;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4, web3_1.getAccount().then(function (a) { return a.toLowerCase(); })];
            case 1:
                account = _b.sent();
                return [4, openpgp.generateKey({
                        userIDs: [{ name: account }],
                        curve: 'ed25519',
                        passphrase: passphrase
                    })];
            case 2:
                _a = _b.sent(), privateKey = _a.privateKey, publicKey = _a.publicKey;
                return [2, { privateKey: privateKey, publicKey: publicKey }];
        }
    });
}); };
exports.generateKey = generateKey;
var _encryptMessagePGP = function (message, recipientsKeys, signatureKeys) { return __awaiter(void 0, void 0, void 0, function () {
    var armoredPublicKeys, encryptionKeys, signingKeys;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                armoredPublicKeys = recipientsKeys.map(function (k) { return k.publicKey; });
                return [4, Promise.all(armoredPublicKeys.map(function (key) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4, openpgp.readKey({ armoredKey: key })];
                            case 1: return [2, (_a.sent()).keys[0]];
                        }
                    }); }); })).then(function (res) { return res.filter(function (k) { return !!k; }); })];
            case 1:
                encryptionKeys = _a.sent();
                if (encryptionKeys.length === 0)
                    throw new Error("No recipients keys set for encryption.");
                signingKeys = [];
                return [2, openpgp.encrypt({
                        message: openpgp.createMessage({ text: message }),
                        encryptionKeys: encryptionKeys,
                        signingKeys: signingKeys
                    })];
        }
    });
}); };
exports._encryptMessagePGP = _encryptMessagePGP;
var _decryptMessagePGP = function (ciphertext, key, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
    var privateKeyObj, _a, _b;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                if (!key || !key.privateKey)
                    throw new Error("PGP Key not set.");
                return [4, openpgp.readKey({ armoredKey: key.privateKey })];
            case 1:
                privateKeyObj = (_d.sent()).keys[0];
                if (!!privateKeyObj.isDecrypted()) return [3, 3];
                return [4, privateKeyObj.decrypt(passphrase)];
            case 2:
                _d.sent();
                _d.label = 3;
            case 3:
                _b = (_a = openpgp).decrypt;
                _c = {};
                return [4, openpgp.readMessage({
                        armoredMessage: ciphertext
                    })];
            case 4: return [2, _b.apply(_a, [(_c.message = _d.sent(),
                        _c.decryptionKeys = [privateKeyObj],
                        _c)])
                    .then(function (_a) {
                    var data = _a.data;
                    return data;
                })];
        }
    });
}); };
exports._decryptMessagePGP = _decryptMessagePGP;
