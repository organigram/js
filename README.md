# Organigram JS

Organigram JS is the JavaScript/TypeScript client for the [Organigram Protocol](https://github/com/organigram/protocol), a framework for building incorruptible governance systems on Ethereum. It provides tools to deploy and interact with blockchain organizations simply and safely, and is used under the hood at [Organigram.ai](https://www.organigram.ai).

See the official [documentation](https://organigram.ai/en/docs/reference/js) for detailed usage examples and API reference.

## Installation
```
// npm:
npm install @organigram/js

// yarn:
yarn add @organigram/js

// pnpm:
pnpm add @organigram/js
```

## Usage

The `@organigram/js` package can be used both client-side and in a Node.js environment.

Initialize the client by providing a viem public client and a wallet client. The public client is used for read-only operations, while the wallet client is used for signing transactions and performing state-changing operations.

```javascript
import { OrganigramClient, Organigram, Organ } from '@organigram/js'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('http://127.0.0.1:8545/')
})
const walletClient = createWalletClient({
    chain: sepolia,
    transport: http('http://127.0.0.1:8545/')
})
const organigramClient = await OrganigramClient.load({
    publicClient,
    walletClient
})
```

Make sure to have a local Ethereum node running at `http://127.0.0.1:8545/` or update the URL to point to your desired Ethereum node. See the [Organigram Protocol repository](https://github.com/organigram/protocol) for instructions on how to set up a local node with Anvil.

Once initialized, you can use the `organigramClient` to interact with the Organigram Protocol, such as deploying organizations, creating proposals, voting, and more.

```javascript
// Deploy a new non-profit organization:
const myNewOrganigram = new Organigram('nonProfit')
const deployed = await organigramClient.deployOrganigram(myNewOrganigram)

// Create a proposal to withdraw funds from an organ:
const organ = await organigramClient.getDeployedOrgan('0xExampleOrganAddress')
const nominationProcedure = await organigramClient.getDeployedProcedure('0xExampleProcedureAddress') // This procedure should have permissions to withdraw funds in the target organ
const data = await Organ.populateTransaction(
    organ.address,
    walletClient as any,
    'withdrawEther',
    [{ to: "0xRecipientAddress", value: 1000000000000000000}]
)
const operation: ProcedureProposalOperation = {
    index: '0',
    target: data.to,
    data: data.data as string,
    value: '0',
    processed: false,
    functionSelector: data.data?.substring(0, 10) as string
}
const proposal = await nominationProcedure.propose({
    cid: '', // Optional CID for off-chain metadata storage (e.g. IPFS)
    operations: [operation]
})

// Approve the proposal:
const approved = await nominationProcedure.nominate(proposal.key)
```

Refer to the official [documentation](https://organigram.ai/en/docs/reference/js) for more usage examples and API reference.

## Contributing

We are looking for TypeScript developers and testers to keep this project secure and up-to-date. Please create issues in our Github page, fork and create Pull-Requests.
