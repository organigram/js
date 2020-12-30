import { getAccount, web3 } from './web3'
import * as openpgp from 'openpgp'

type Key = {
    privateKeyArmored?: string
    publicKeyArmored: string
}

const deployKey = (key: Key, keyserver: Address) => {
    return Promise.reject(new Error("Not implemented"))
}

const sign = async (message: string) => {
    const account = await getAccount()
    if (!account)
        throw new Error("No wallet found.")
    return web3.eth.personal.sign(message, account, "")
}

const verify = (message: Uint8Array, signature: string) => {
    return Promise.reject(new Error("Not implemented"))
}

const encrypt = (data: Uint8Array): Promise<Uint8Array> => {
    // get key
    return Promise.reject(new Error("Not implemented"))
}

const decrypt = (data: Uint8Array): Promise<Uint8Array> => {
    return Promise.reject(new Error("Not implemented"))
}

const pin = (data: Uint8Array): Promise<any> => {
    return Promise.reject(new Error("Not implemented"))
}

const generateSignature = async (): Promise<string> => {
    const account = await getAccount()
    if (!account)
        throw new Error("No wallet found.")
    const message = `Generating Organigr.am Vault keys for ${account}...`
    return sign(message)
}

const generatePassword = async (): Promise<string> => Buffer.from(await openpgp.crypto.random.getRandomBytes(44)).toString('hex')

const verifySignature = async (signature: string, account: Address): Promise<boolean> => {
    return web3.eth.personal.ecRecover(
        `Generating Organigr.am Vault keys for ${account}...`,
        signature
    )
    .then(_account => _account.toLowerCase() === account.toLowerCase())
    .catch(error => {
        console.warn("Signature supplied for verification is not valid for the current account.", error.message)
        return false
    })
}

const loadKeys = async () => {
    const account = getAccount()
    if (!account)
        throw new Error("No wallet found.")
    let signature = sessionStorage.getItem(`organigram-signature-${account}`)
    if (!signature)
        signature = await Promise.resolve("")
    
}

const generateKey = async (passphrase: string): Promise<Key> => {
    const account = await getAccount()
    const { privateKeyArmored, publicKeyArmored } = await openpgp.generateKey({
        userIds: [{ name: account }],
        curve: 'ed25519', // ECDH for encryption and EdDSA for signature.
        passphrase
    })
    return { privateKeyArmored, publicKeyArmored }
}

// Encrypt message with PGP symmetric keys.
const _encryptMessagePGP = async (message: string, recipientsKeys: Key[], signatureKeys?:Key[]) => {
    const armoredPublicKeys = recipientsKeys.map(k => k.publicKeyArmored)
    const publicKeys = await Promise.all(armoredPublicKeys.map(async key =>
        (await openpgp.key.readArmored(key)).keys[0]
    )).then(res => res.filter(k => !!k))
    if (publicKeys.length === 0)
        throw new Error("No recipients keys set for encryption.")
    // @todo : Use signature keys, if unlockable.
    const privateKeys: any[] = []
    return openpgp.encrypt({
        message: openpgp.message.fromText(message),
        publicKeys,
        privateKeys
    }).then(m => m.data)
}

// Decrypt message with PGP symmetric keys.
const _decryptMessagePGP = async (ciphertext: string, key: Key, passphrase: string) => {
    if (!key || !key.privateKeyArmored)
        throw new Error("PGP Key not set.")
    const privateKeyObj = (await openpgp.key.readArmored(key.privateKeyArmored)).keys[0]
    if (!privateKeyObj.isDecrypted())
        await privateKeyObj.decrypt(passphrase)
    return openpgp.decrypt({
        message: await openpgp.message.readArmored(ciphertext),
        privateKeys: [privateKeyObj],
    })
    .then(m => m.data)
}

export  {
    openpgp,
    Key,
    deployKey,
    generateSignature,
    generatePassword,
    verifySignature,
    generateKey,
    sign,
    verify,
    encrypt,
    decrypt,
    _encryptMessagePGP,
    _decryptMessagePGP
}