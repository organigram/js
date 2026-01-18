# Organigram.ai JavaScript SDK
Organigram.ai JS SDK enables web apps to integrate with IPFS and Ethereum and update their organigrams in a completely decentralized way.  
Users data can be easily encrypted using OpenPGP.js before even leaving the computer.

## Installation
```
pnpm add ipfs web3 @organigram/sdk
```

## Usage
```javascript
const organigramSDK = require('@organigram/sdk')

const {
  ipfs,       // Interact with IPFS.
  web3,       // Interact with Ethereum.
  openpgp,    // Encrypt and decrypt data.
  organ,      // Interact with an organ.
  procedure,  // Interact with a procedure.
  keyserver,  // Interact with PGP keys.
  organigram  // Map an organigram.
} = organigramSDK

// Generates and load the user's encryption keys.
await openpgp.init()

// Fetch organigram 123 from organigr.am.
const org123 = await organigram(123)
// Returns an Organigram if 123 exists and is public.

const admins = await organ(org123.organs[0].address)
// Returns an Organ if deployed on the current Ethereum network.

const nominateAdmins = await procedure(admins.procedures[0].address)
// Returns a Procedure if deployed on the current Ethereum network.

// Call methods directly on the smart contract.
const firstAdmin = await admins.getEntry(0)

const metadataFile = new File() // e.g. From an upload.
// Encrypt using user key if it exists.
const encryptedFile = openpgp.encrypt(metadataFile)
// Use the generated file in your methods.
await nominateAdmins.addEntry("0x0123456789123456789", encryptedFile)
```

## PGP Keyserver
To share public keys between accounts, Organigr.am provides a public decentralized keyserver on Rinkeby Ethereum test network. You can opt-out of this keyserver and provide your own Ethereum smart-contract or keyserver implementation.

## Interacting with IPFS
An IPFS node will run in the browser of your visitors, and connect to other peers on the IPFS network. When sharing data, users will by default simply add them to their local nodes. When they leave your app, the IPFS node disconnects and files are not accessible anymore.  
To store files more permanently and distribute them optimally, you can either pin the files on your own servers, or use Organigr.am Pinning Service automatically.

## Interacting with Organigr.am 
You will need an API key to interact with your account or organisation's data.
