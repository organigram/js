import * as openpgp from 'openpgp';
import type { Address } from './types';
declare type Key = {
    privateKey?: string;
    publicKey: string;
};
declare const deployKey: (key: Key, keyserver: Address) => Promise<never>;
declare const sign: (message: string) => Promise<any>;
declare const verify: (message: string, signature: string, account: Address) => Promise<boolean>;
declare const encrypt: (data: Uint8Array) => Promise<Uint8Array>;
declare const decrypt: (data: Uint8Array) => Promise<Uint8Array>;
declare const decryptFile: (cipherdata: Uint8Array, passphrase: string) => Promise<Uint8Array>;
declare const generateSignature: () => Promise<string>;
declare const generatePassword: () => Promise<string>;
declare const generateKey: (passphrase: string) => Promise<Key>;
declare const _encryptMessagePGP: (message: string, recipientsKeys: Key[], signatureKeys?: Key[]) => Promise<any>;
declare const _decryptMessagePGP: (ciphertext: string, key: Key, passphrase: string) => Promise<any>;
export { openpgp, Key, deployKey, generateSignature, generatePassword, generateKey, sign, verify, encrypt, decrypt, decryptFile, _encryptMessagePGP, _decryptMessagePGP };
