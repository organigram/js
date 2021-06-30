"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._decryptMessagePGP = exports._encryptMessagePGP = exports.decryptFile = exports.decrypt = exports.encrypt = exports.verify = exports.sign = exports.generateKey = exports.generatePassword = exports.generateSignature = exports.deployKey = exports.openpgp = void 0;
const web3_1 = require("./web3");
const openpgp = __importStar(require("openpgp"));
exports.openpgp = openpgp;
const deployKey = (key, keyserver) => {
    return Promise.reject(new Error("Not implemented"));
};
exports.deployKey = deployKey;
const sign = (message) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield web3_1.getAccount();
    if (!account)
        throw new Error("No wallet found.");
    return web3_1.web3.eth.personal.sign(message, account, "");
});
exports.sign = sign;
const verify = (message, signature, account) => __awaiter(void 0, void 0, void 0, function* () {
    if (!account)
        throw new Error("No wallet found.");
    account = account.toLowerCase();
    return web3_1.ecRecover(message, signature)
        .then(a => Boolean(a && a === account))
        .catch(() => false);
});
exports.verify = verify;
const encrypt = (data) => {
    return Promise.reject(new Error("Not implemented"));
};
exports.encrypt = encrypt;
const decrypt = (data) => {
    return Promise.reject(new Error("Not implemented"));
};
exports.decrypt = decrypt;
const decryptFile = (cipherdata, passphrase) => {
    return Promise.reject(new Error("Not implemented"));
};
exports.decryptFile = decryptFile;
const generateSignature = () => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield web3_1.getAccount().then(a => a.toLowerCase());
    if (!account)
        throw new Error("No wallet found.");
    const message = `Generating Organigr.am Vault keys for ${account}...`;
    return sign(message);
});
exports.generateSignature = generateSignature;
const generatePassword = () => __awaiter(void 0, void 0, void 0, function* () { return Buffer.from(yield openpgp.RandomBuffer.getRandomBytes(44)).toString('hex'); });
exports.generatePassword = generatePassword;
const generateKey = (passphrase) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield web3_1.getAccount().then(a => a.toLowerCase());
    const { privateKeyArmored, publicKeyArmored } = yield openpgp.generateKey({
        userIDs: [{ name: account }],
        curve: 'ed25519',
        passphrase
    });
    return { privateKeyArmored, publicKeyArmored };
});
exports.generateKey = generateKey;
const _encryptMessagePGP = (message, recipientsKeys, signatureKeys) => __awaiter(void 0, void 0, void 0, function* () {
    const armoredPublicKeys = recipientsKeys.map(k => k.publicKeyArmored);
    const encryptionKeys = yield Promise.all(armoredPublicKeys.map((key) => __awaiter(void 0, void 0, void 0, function* () { return (yield openpgp.readKey({ armoredKey: key })).keys[0]; }))).then(res => res.filter(k => !!k));
    if (encryptionKeys.length === 0)
        throw new Error("No recipients keys set for encryption.");
    const signingKeys = [];
    return openpgp.encrypt({
        message: openpgp.createMessage({ text: message }),
        encryptionKeys,
        signingKeys
    });
});
exports._encryptMessagePGP = _encryptMessagePGP;
const _decryptMessagePGP = (ciphertext, key, passphrase) => __awaiter(void 0, void 0, void 0, function* () {
    if (!key || !key.privateKeyArmored)
        throw new Error("PGP Key not set.");
    const privateKeyObj = (yield openpgp.readKey({ armoredKey: key.privateKeyArmored })).keys[0];
    if (!privateKeyObj.isDecrypted())
        yield privateKeyObj.decrypt(passphrase);
    return openpgp.decrypt({
        message: yield openpgp.readMessage({
            armoredMessage: ciphertext
        }),
        decryptionKeys: [privateKeyObj],
    })
        .then(({ data }) => data);
});
exports._decryptMessagePGP = _decryptMessagePGP;
