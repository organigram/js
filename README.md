# Organigram JS

Organigram JS is the JavaScript/TypeScript client for the [Organigram Protocol](https://organigram.ai/en/docs/protocol), a suite of smart contracts for running organizations on Ethereum-compatible blockchains. It deploys, reads and operates those contracts from any JavaScript environment, browser or Node.js, and is the library used under the hood by [Organigram.ai](https://organigram.ai) and by `@organigram/react`.

## Installation

```bash
pnpm add @organigram/js viem
```

[viem](https://viem.sh) is a peer dependency: Organigram JS never holds keys itself, it uses the viem clients you give it.

## How it works

An organization is modelled as an **organigram**: a set of **organs** connected by **procedures**, optionally holding **assets**. Each of them is a smart contract, and each has a class in this library that loads its on-chain state, writes to it, and serializes it to JSON.

| Class | Role |
| --- | --- |
| `OrganigramClient` | Entry point. Connects to the protocol on one chain, deploys contracts and loads them. |
| `Organigram` | The whole organization: its organs, assets and procedures, as a draft or as deployed contracts. It has no contract of its own. |
| `Organ` | A group: a registry of entries (members, documents), a list of permissions, and a balance of assets. |
| `Procedure` | The rules by which the members of some organs may change other organs. |
| `NominationProcedure` | A procedure where any one member of the deciders organ adopts or rejects a proposal alone. |
| `VoteProcedure` | A procedure where the members of an organ vote. |
| `ERC20VoteProcedure` | A procedure where votes are weighted by an ERC-20 token. |
| `Asset` | An ERC-20 token, either a plain asset or company equity. |

### The client

`OrganigramClient.load()` connects to the `OrganigramClient` contract deployed on the chain of your viem public client, and reads the procedure types registered there. The public client is used for every read; the wallet client, when provided, signs the transactions. Without a wallet client, the library is read-only.

The client keeps loaded organs, procedures and assets in memory: `loadOrgan()`, `loadProcedure()` and `loadAsset()` return the cached object unless you pass `{ fresh: true }`.

### Organs and permissions

An organ stores three things:

- **entries**: each one an Ethereum address (a member) or a content reference (a document), or both;
- **permissions**: which addresses may act on the organ, as a bit field from `PERMISSIONS` (`ADD_ENTRIES`, `WITHDRAW_ETHER`, `ADD_PERMISSIONS`…). `getPermissionsSet()` turns a value back into names;
- **assets**: ether and ERC-20 tokens, which only addresses with the matching permission can withdraw.

In a governed organization, permissions are granted to procedures rather than to people, so that every change goes through a decision.

### Proposals and decisions

A procedure names three roles, each held by the members of an organ (or, for an ERC-20 vote, by the token holders): the **proposers** who may submit proposals, the **moderators** who may filter them when moderation is enabled, and the **deciders** who adopt or reject them. A proposal is a list of operations, calls to organs that the procedure has permission to make, plus a reference to its off-chain metadata.

1. `propose()` submits the proposal.
2. With moderation, a moderator either accepts it with `presentProposal()` or rejects it with `blockProposal()`.
3. The deciders decide: `nominate()` or `reject()` for a nomination, `vote()` then `count()` once the vote is over for the vote procedures.
4. Adoption executes the operations on the target organs. `applyProposal()` retries the operations that were not processed yet.

Every write also exists as a `…BySig` variant: the user signs an EIP-712 message and any relayer submits it, so users do not need gas.

### Deploying an organigram

`organigram.deploy()` deploys organs, assets and procedures in one transaction, then loads them back from the chain. Under the hood it calls `client.deployOrganigram()`, which you can call directly when you only need the new addresses. Contracts are deployed as clones at addresses predicted from a salt, which lets a draft reference contracts that do not exist yet, for example a procedure deciding on an organ deployed in the same batch. `templates` provides ready-made organigrams (`sas`, `sarl`, `nonProfit`, `openSource`…), and `isTemplateSupportedOnChain()` tells whether a chain has the contracts a template needs.

### Off-chain storage

Contracts only store references. Metadata and documents live off-chain and are referenced by CID refs of the form `og://workspace/<workspace>/<key>`, built with `formatCidRef()` and read with `parseCidRef()`. Proposals must carry such a reference.

The encryption helpers (`generateUserEncryptionKeyPair`, `wrapGroupKeyForRecipient`, `encryptBytes`…) implement the end-to-end encryption of documents used by Organigram.ai: content keys encrypt documents, group keys wrap content keys, and each member's key pair unwraps group keys. They run on the Web Crypto API of the user's device. Keep private keys there: never send them to a server, never log them, and only export them to a storage you encrypt yourself.

## Usage

Connect to the protocol with a browser wallet:

```ts
import { OrganigramClient } from '@organigram/js'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { sepolia } from 'viem/chains'

const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
const publicClient = createPublicClient({ chain: sepolia, transport: http() })
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: custom(window.ethereum)
})

const client = await OrganigramClient.load({ publicClient, walletClient })
```

Deploy an organization from a template:

```ts
import { Organigram, getTemplate } from '@organigram/js'

const organigram = await new Organigram({
  ...getTemplate('nonProfit', client.chainId),
  organigramClient: client
}).deploy()
```

Propose to add a member to an organ, then adopt the proposal through a nomination procedure:

```ts
import { NominationProcedure, Organ, Procedure, formatCidRef } from '@organigram/js'

const procedure = (await client.loadProcedure(
  procedureAddress
)) as NominationProcedure

const call = await Organ.populateTransaction(organAddress, walletClient, 'addEntries', [
  { address: newMemberAddress }
])
const proposal = await procedure.propose({
  cid: formatCidRef({ scopeType: 'workspace', scopeId: workspaceId }, 'add-member'),
  operations: [Procedure.createOperation(call)]
})

await procedure.nominate(proposal.key)
```

The procedure must hold the `ADD_ENTRIES` permission on the organ, and the connected account must belong to its proposers and deciders.

## Contributing

We are looking for TypeScript developers and testers to keep this project secure and up to date. Please open issues on [GitHub](https://github.com/organigram/js), fork the repository and send pull requests.
