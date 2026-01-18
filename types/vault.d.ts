import * as openpgp from 'openpgp'
import { Address } from './types'
interface Key {
    privateKey?: string;
    publicKey: string;
}
declare const deployKey: (key: Key, keyserver: Address) => Promise<never>
declare const sign: (message: string) => Promise<any>
declare const verify: (message: string, signature: string, account: Address) => Promise<boolean>
declare const encrypt: (data: Uint8Array) => Promise<Uint8Array>
declare const decrypt: (data: Uint8Array) => Promise<Uint8Array>
declare const decryptFile: (cipherdata: Uint8Array, passphrase: string) => Promise<Uint8Array>
declare const generateSignature: () => Promise<string>
declare const generatePassword: () => Promise<string>
declare const generateKey: (passphrase: string) => Promise<Key>
declare const _encryptMessagePGP: (message: string, recipientsKeys: Key[], signatureKeys?: Key[]) => Promise<openpgp.WebStream<string>>
declare const _decryptMessagePGP: (ciphertext: string, key: Key, passphrase: string) => Promise<(string & openpgp.WebStream<string>) | (Uint8Array & openpgp.WebStream<string>) | (openpgp.WebStream<openpgp.Data> & openpgp.WebStream<string>) | (openpgp.NodeStream<openpgp.Data> & openpgp.WebStream<string>)>
export { openpgp, Key, deployKey, generateSignature, generatePassword, generateKey, sign, verify, encrypt, decrypt, decryptFile, _encryptMessagePGP, _decryptMessagePGP }
