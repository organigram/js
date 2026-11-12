import ProcedureContractABI from '@organigram/protocol/abi/Procedure.sol/Procedure.json' with { type: 'json' };
import { decodeAbiParameters, decodeFunctionResult, encodeAbiParameters, encodeFunctionData, encodePacked, keccak256, parseAbiParameters, isAddress, toFunctionSelector, toHex, zeroAddress } from 'viem';
import { capitalize, createRandom32BytesHexId, handleJsonBigInt, predictContractAddress } from '../utils';
import { getDefaultChainId, getDeployment } from '../deployments';
import { isCidRef } from '../ipfs/scopeEnvelope';
import { tryMulticall } from '../multicall';
import { ProcedureTypeNameEnum, getProcedureType } from './utils';
import { createContractWriteTransaction, getContractInstance, getWalletAccount } from '../contracts';
/** Reject malformed calls before a proposal can be persisted on-chain. */
export const assertValidProposalOperations = (operations) => {
    if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('A proposal must contain at least one valid operation.');
    }
    operations.forEach((operation, index) => {
        if (operation.target == null ||
            !isAddress(operation.target) ||
            operation.target.toLowerCase() === zeroAddress) {
            throw new Error(`Operation ${index + 1} must target a non-zero contract address.`);
        }
        if (typeof operation.data !== 'string' ||
            !/^0x[\da-fA-F]{8,}$/.test(operation.data) ||
            operation.data.length % 2 !== 0) {
            throw new Error(`Operation ${index + 1} must contain a contract call.`);
        }
        try {
            if (BigInt(operation.index) < 0n || BigInt(operation.value ?? '0') < 0n) {
                throw new Error('negative value');
            }
        }
        catch {
            throw new Error(`Operation ${index + 1} has an invalid index or value.`);
        }
    });
};
const normalizeProcedureData = (data) => ({
    cid: data.cid ?? data[0],
    proposers: data.proposers ?? data[1],
    moderators: data.moderators ?? data[2],
    deciders: data.deciders ?? data[3],
    withModeration: data.withModeration ?? data[4] ?? false,
    proposalsLength: BigInt(data.proposalsLength ?? data[5] ?? 0),
    interfaceId: data.interfaceId ?? data[6]
});
const normalizeTupleEntry = (value) => ({
    addr: value?.addr ?? value?.address ?? value?.[0],
    cid: value?.cid ?? value?.[1]
});
const normalizeProposal = (proposal, key) => ({
    key,
    creator: proposal.creator ?? proposal[0],
    cid: proposal.cid ?? proposal[1],
    blockReason: proposal.blockReason ?? proposal[2],
    presented: proposal.presented ?? proposal[3],
    blocked: proposal.blocked ?? proposal[4],
    adopted: proposal.adopted ?? proposal[5],
    applied: proposal.applied ?? proposal[6],
    operations: (proposal.operations ?? proposal[7] ?? []).map((operation) => Procedure.parseOperation(operation))
});
export const procedureFunctions = [
    {
        funcSig: '0x4d3f8407',
        key: 'updateCid',
        signature: 'updateCid(string)',
        label: 'Update cid',
        tags: ['cid', 'replace'],
        params: ['cid'],
        target: 'organ'
    },
    {
        funcSig: '0xd610b570',
        key: 'addEntries',
        signature: 'addEntries(OrganLibrary.Entry[])',
        label: 'Add entries',
        tags: ['entries', 'add'],
        params: ['entries'],
        target: 'organ'
    },
    {
        funcSig: '0x7615eb81',
        key: 'removeEntries',
        signature: 'removeEntries(uint256[])',
        label: 'Remove entries',
        tags: ['entries', 'remove'],
        params: ['indexes'],
        target: 'organ'
    },
    {
        funcSig: '0x62f7f997',
        key: 'replaceEntry',
        signature: 'replaceEntry(uint256,CoreLibrary.Entry)',
        label: 'Replace entry',
        tags: ['entries', 'replace'],
        params: ['index', 'entry'],
        target: 'organ'
    },
    {
        funcSig: '0x7f0a4e27',
        key: 'addPermission',
        signature: 'addPermission(address,bytes2)',
        label: 'Add permission',
        tags: ['permissions', 'add'],
        params: ['permissionAddress', 'permissionValue'],
        target: 'organ'
    },
    {
        funcSig: '0x19b9404c',
        key: 'removePermission',
        signature: 'removePermission(address)',
        label: 'Remove permission',
        tags: ['permissions', 'remove'],
        params: ['permissionAddress'],
        target: 'organ'
    },
    {
        funcSig: '0xd0922d4a',
        key: 'replacePermission',
        signature: 'replacePermission(address,address,bytes2)',
        label: 'Replace permission',
        tags: ['permissions', 'replace'],
        params: ['oldPermissionAddress', 'newPermissionAddress', 'permissionValue'],
        target: 'organ'
    },
    {
        funcSig: toFunctionSelector('transferEther(address,uint256)'),
        key: 'withdrawEther',
        signature: 'transferEther(address,uint256)',
        label: 'Withdraw ether',
        tags: ['transfer', 'withdraw', 'ether'],
        params: ['address', 'amount'],
        target: 'organ'
    },
    {
        funcSig: '0xf49b5848',
        key: 'withdrawERC20',
        signature: 'transferCoins(address,address,address,uint256)',
        label: 'Withdraw ERC20',
        tags: ['transfer', 'withdraw', 'coins', 'erc20'],
        params: ['address', 'address', 'address', 'amount'],
        target: 'organ'
    },
    {
        funcSig: '0xbdb3e1c4',
        key: 'withdrawERC721',
        signature: 'transferCollectible(address,address,address,uint256)',
        label: 'Withdraw ERC721',
        tags: ['transfer', 'withdraw', 'collectibles', 'erc721'],
        params: ['address', 'address', 'address', 'tokenId'],
        target: 'organ'
    },
    {
        funcSig: toFunctionSelector('executeWhitelisted(address,uint256,bytes)'),
        key: 'externalCall',
        signature: 'executeWhitelisted(address,uint256,bytes)',
        label: 'External call',
        tags: ['transfer'],
        params: ['address', 'amount', 'bytes'],
        target: 'organ'
    },
    {
        funcSig: toFunctionSelector('transferEquity(address,address,uint256,string)'),
        key: 'transferEquity',
        signature: 'transferEquity(address,address,uint256,string)',
        label: 'Transfer equity asset',
        tags: ['transfer', 'erc20'],
        params: ['address', 'address', 'amount', 'cid'],
        target: 'self'
    }
];
/**
 * The rules by which the members of some organs may change other organs.
 *
 * @remarks A proposal is a list of operations. Proposers submit it with `propose()`. With moderation, a moderator presents it with `presentProposal()` or blocks it with `blockProposal()`. Deciders then adopt or reject it, depending on the procedure type, and adoption runs its operations.
 * Every action also has a signed variant (`sign…` then `…BySig`), so that a relayer submits it and users need no gas.
 */
export class Procedure {
    /** ERC-165 interface identifier of procedure contracts. */
    static INTERFACE = '0x71dbd330';
    /**
     * Functions a proposal operation can call, with what a form needs to build them.
     */
    static OPERATIONS_FUNCTIONS = procedureFunctions;
    /** Display name. */
    name;
    /** Free description. */
    description;
    /** Contract address, or a predicted address while it is a draft. */
    address;
    /** Procedure type: `nomination`, `vote` or `erc20Vote`. */
    typeName;
    /** Reference to the off-chain metadata of the procedure. */
    cid;
    /** Whether the contract exists on chain. */
    isDeployed;
    /** Organ whose members adopt or reject proposals, or a single address. */
    deciders;
    /** Organ whose members may submit proposals, or a single address. */
    proposers;
    /** Whether proposals must be presented by a moderator before the decision. */
    withModeration;
    /**
     * Organ whose members may present or block proposals, when moderation is enabled.
     */
    moderators;
    /** Off-chain metadata, as a JSON string. */
    metadata;
    /**
     * Parameters specific to the procedure type, as a JSON string, such as the vote duration.
     */
    data;
    /** Trusted forwarder relaying gasless transactions. */
    forwarder;
    /** Proposals submitted so far. */
    proposals;
    /** viem contract instance, once loaded. */
    contract;
    /** Salt that determines the clone address. */
    salt;
    /** Chain the procedure lives on. */
    chainId;
    /** Client that signs transactions. */
    walletClient;
    /** Client used for reads. */
    publicClient;
    /** Organigram the procedure belongs to. */
    organigramId;
    /** Registered procedure type this procedure is a clone of. */
    type;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, publicClient, walletClient, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId, }) {
        if (typeName == null || deciders == null) {
            throw new Error('typeName and deciders are required to create a procedure.');
        }
        if (!(typeName in ProcedureTypeNameEnum)) {
            throw new Error(`typeName must be one of ${Object.values(ProcedureTypeNameEnum).join(', ')}.`);
        }
        this.salt = salt ?? (isDeployed ? undefined : createRandom32BytesHexId());
        this.address =
            address ??
                predictContractAddress({
                    type: (capitalize(typeName) + 'Procedure'),
                    chainId: chainId ?? getDefaultChainId(),
                    salt: this.salt
                });
        this.deciders = deciders;
        this.typeName = typeName;
        this.isDeployed = isDeployed ?? false;
        this.cid = cid ?? this.typeName;
        this.name = name ?? 'Unnamed procedure';
        this.description = description ?? '';
        this.chainId = chainId ?? getDefaultChainId();
        this.organigramId = organigramId ?? 'default-organigram-id';
        this.metadata = metadata ?? '{}';
        this.proposers = proposers ?? deciders;
        this.moderators = moderators ?? zeroAddress;
        this.withModeration = withModeration ?? false;
        this.forwarder = forwarder ?? getDeployment(this.chainId, 'MetaGasStation');
        this.proposals = proposals ?? [];
        this.walletClient = walletClient ?? undefined;
        this.publicClient = publicClient ?? undefined;
        this.contract =
            this.publicClient != null
                ? getContractInstance({
                    address: this.address,
                    abi: ProcedureContractABI.abi,
                    publicClient: this.publicClient,
                    walletClient: this.walletClient
                })
                : undefined;
        this.type = type ?? getProcedureType(this.chainId, this.typeName);
        this.data = data ?? '';
    }
    /** The viem clients of the procedure. */
    getClients() {
        if (this.publicClient == null) {
            throw new Error('Public client not connected.');
        }
        return {
            publicClient: this.publicClient,
            walletClient: this.walletClient
        };
    }
    /** @internal */
    static async _populateInitialize(_populateInitializeInput, _clients) {
        throw new Error('Procedure cannot be initialized.');
    }
    /** Read the roles, metadata reference and proposal count of a procedure. */
    static async loadData(address, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        return normalizeProcedureData(await contract.read.getProcedure());
    }
    /** Read one proposal of a procedure. */
    static async loadProposal(address, proposalKey, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        const proposal = await contract.read.getProposal([BigInt(proposalKey)]);
        return normalizeProposal(proposal, proposalKey);
    }
    /** Read every proposal of a procedure. */
    static async loadProposals(address, clients, data) {
        const procedureData = data ?? (await Procedure.loadData(address, clients));
        const proposalsLength = Number(procedureData.proposalsLength);
        const multicallProposals = await tryMulticall(clients, Array.from({ length: proposalsLength }).map((_, index) => {
            const key = index.toString();
            return {
                target: address,
                callData: encodeFunctionData({
                    abi: ProcedureContractABI.abi,
                    functionName: 'getProposal',
                    args: [BigInt(index)]
                }),
                decode: returnData => normalizeProposal(decodeFunctionResult({
                    abi: ProcedureContractABI.abi,
                    functionName: 'getProposal',
                    data: returnData
                }), key)
            };
        }));
        if (multicallProposals != null) {
            return multicallProposals.filter((proposal) => proposal != null);
        }
        return (await Promise.all(Array.from({ length: proposalsLength }).map(async (_, index) => {
            const key = index.toString();
            return await Procedure.loadProposal(address, key, clients).catch((error) => {
                console.warn('Error while loading proposal in procedure.', address, key, error.message);
                return null;
            });
        }))).filter((proposal) => proposal != null);
    }
    /** Read a procedure from chain, with its proposals. */
    static async load(address, clients, initialProcedure) {
        if (!address) {
            throw new Error('No address provided.');
        }
        const chainId = initialProcedure?.chainId ??
            String(await clients.publicClient.getChainId());
        if (initialProcedure?.typeName == null && initialProcedure?.type == null) {
            const isProcedure = await Procedure.isProcedure(address, clients);
            if (!isProcedure) {
                throw new Error('Contract at address is not a Procedure.');
            }
        }
        const data = await Procedure.loadData(address, clients);
        const proposals = await Procedure.loadProposals(address, clients, data);
        return new Procedure({
            ...initialProcedure,
            typeName: initialProcedure?.typeName ?? 'nomination',
            cid: data.cid,
            address,
            chainId,
            publicClient: clients.publicClient,
            walletClient: clients.walletClient,
            metadata: initialProcedure?.metadata ?? '{}',
            proposers: data.proposers,
            moderators: data.moderators,
            deciders: data.deciders,
            withModeration: data.withModeration,
            forwarder: initialProcedure?.forwarder ?? getDeployment(chainId, 'MetaGasStation'),
            proposals,
            isDeployed: true
        });
    }
    /** @internal */
    static _stringifyParamType(type) {
        switch (type) {
            case 'cid':
                return 'string';
            case 'index':
                return 'uint256';
            case 'indexes':
                return 'uint256[]';
            case 'permissionValue':
                return 'bytes2';
            case 'addresses':
                return 'address[]';
            case 'bytes':
                return 'bytes';
            case 'address':
            case 'organ':
            case 'permissionAddress':
            case 'oldPermissionAddress':
            case 'newPermissionAddress':
                return 'address';
            case 'proposal':
            case 'proposals':
                return 'uint256';
            case 'entry':
                return '(address,string)';
            case 'entries':
                return '(address,string)[]';
            case 'amount':
            case 'tokenId':
                return 'uint256';
            default:
                return 'uint256';
        }
    }
    /** @internal */
    static _extractParams(types, operation) {
        if (operation?.data != null) {
            const decodedParams = decodeAbiParameters(parseAbiParameters(types.map(type => Procedure._stringifyParamType(type)).join(', ')), `0x${operation.data.substring(10)}`);
            return types.map((type, index) => {
                let value = decodedParams[index];
                switch (type) {
                    case 'cid':
                        value = value;
                        break;
                    case 'entry':
                        value = normalizeTupleEntry(value);
                        break;
                    case 'entries':
                        value = value.map(normalizeTupleEntry);
                        break;
                    default:
                }
                return { type, value };
            });
        }
        return types.map(type => ({ type }));
    }
    /** Normalize an operation read from chain. */
    static parseOperation(rawOperation) {
        const operationTuple = rawOperation;
        const index = (operationTuple.index ?? operationTuple[0]).toString();
        const target = operationTuple.target ?? operationTuple[1];
        const data = (operationTuple.data ?? operationTuple[2]);
        const value = (operationTuple.value ?? operationTuple[3])?.toString();
        const processed = operationTuple.processed ?? operationTuple[4];
        const functionSelector = data.toString().slice(0, 10);
        const operation = {
            index,
            target,
            value,
            data,
            processed,
            functionSelector
        };
        operation.function = Procedure.OPERATIONS_FUNCTIONS.find(procedureFunction => procedureFunction.funcSig === functionSelector);
        if (operation.function == null) {
            return operation;
        }
        operation.params =
            operation.function.params != null
                ? Procedure._extractParams(operation.function.params, operation)
                : [];
        return operation;
    }
    /** Tell whether a contract is a procedure. */
    static async isProcedure(address, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        return Boolean(await contract.read.supportsInterface(['0x01ffc9a7']));
    }
    /**
     * Submit a proposal.
     *
     * @param input - Reference to the proposal metadata, which must be a CID reference, and its operations.
     */
    async propose(input) {
        if (input.cid.trim() === '') {
            throw new Error('A proposal must include its metadata reference.');
        }
        if (!isCidRef(input.cid)) {
            throw new Error('A proposal metadata reference must be scoped to its workspace.');
        }
        assertValidProposalOperations(input.operations);
        const publicClient = this.publicClient;
        if (publicClient == null)
            throw new Error('Public client not connected.');
        await Promise.all([
            ...new Set(input.operations.map(operation => operation.target == null || operation.target === zeroAddress
                ? this.address
                : operation.target))
        ].map(async (target) => {
            const code = await publicClient.getCode({
                address: target
            });
            if (code == null || code === '0x') {
                throw new Error(`Proposal operation target ${target} is not deployed.`);
            }
        }));
        const currentProcedureData = await Procedure.loadData(this.address, this.getClients());
        const ops = input.operations.map(operation => ({
            index: operation.index != null && operation.index !== ''
                ? BigInt(operation.index)
                : 0n,
            target: operation.target ?? zeroAddress,
            data: operation.data,
            value: BigInt(operation.value ?? '0'),
            processed: false
        }));
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'propose',
            args: [input.cid, ops],
            clients: this.getClients(),
            nonce: input.options?.nonce
        });
        input.options?.onTransaction?.(tx, `Create proposal with CID ${input.cid} on procedure ${this.address}`);
        const receipt = await tx.wait();
        const proposalKey = currentProcedureData.proposalsLength.toString();
        const proposal = await Procedure.loadProposal(this.address, proposalKey, this.getClients());
        const proposalWithTransaction = {
            ...proposal,
            transactionHash: receipt.transactionHash
        };
        this.proposals.push(proposalWithTransaction);
        return proposalWithTransaction;
    }
    /**
     * Sign a proposal, so that another account submits it with `proposeBySig()`.
     *
     * @remarks The signer pays no gas: any account can submit the signature with the matching `…BySig` method.
     */
    async signProposal(input) {
        if (this.walletClient == null) {
            throw new Error('Connected wallet cannot sign typed data.');
        }
        const account = await getWalletAccount(this.walletClient);
        const ops = input.operations.map(operation => ({
            index: operation.index != null && operation.index !== ''
                ? BigInt(operation.index)
                : 0n,
            target: (operation.target ?? zeroAddress),
            data: operation.data,
            value: BigInt(operation.value ?? '0')
        }));
        const operationTypeHash = keccak256(toHex('Operation(uint256 index,address target,bytes data,uint256 value)'));
        const operationHashes = ops.map(operation => keccak256(encodeAbiParameters(parseAbiParameters(['bytes32', 'uint256', 'address', 'bytes32', 'uint256'].join(', ')), [
            operationTypeHash,
            operation.index,
            operation.target,
            keccak256(operation.data),
            operation.value
        ])));
        return await this.walletClient.signTypedData({
            account,
            domain: this.getTypedDataDomain(),
            primaryType: 'Proposal',
            types: {
                Operation: [
                    { name: 'index', type: 'uint256' },
                    { name: 'target', type: 'address' },
                    { name: 'data', type: 'bytes' },
                    { name: 'value', type: 'uint256' }
                ],
                Proposal: [
                    { name: 'cid', type: 'string' },
                    { name: 'operationsHash', type: 'bytes32' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            },
            message: {
                cid: input.cid,
                operationsHash: keccak256(encodePacked(['bytes32[]'], [operationHashes])),
                nonce: input.nonce,
                deadline: BigInt(input.deadline)
            }
        });
    }
    /** Sign the presentation of a proposal, for `presentProposalBySig()`. */
    async signPresentProposal(input) {
        if (this.walletClient == null) {
            throw new Error('Connected wallet cannot sign typed data.');
        }
        const account = await getWalletAccount(this.walletClient);
        return await this.walletClient.signTypedData({
            account,
            domain: this.getTypedDataDomain(),
            primaryType: 'PresentProposal',
            types: {
                PresentProposal: [
                    { name: 'proposalKey', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            },
            message: {
                ...input,
                proposalKey: BigInt(input.proposalKey),
                deadline: BigInt(input.deadline)
            }
        });
    }
    /** Sign the block of a proposal, for `blockProposalBySig()`. */
    async signBlockProposal(input) {
        if (this.walletClient == null) {
            throw new Error('Connected wallet cannot sign typed data.');
        }
        const account = await getWalletAccount(this.walletClient);
        return await this.walletClient.signTypedData({
            account,
            domain: this.getTypedDataDomain(),
            primaryType: 'BlockProposal',
            types: {
                BlockProposal: [
                    { name: 'proposalKey', type: 'uint256' },
                    { name: 'reason', type: 'string' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            },
            message: {
                ...input,
                proposalKey: BigInt(input.proposalKey),
                deadline: BigInt(input.deadline)
            }
        });
    }
    /** Sign the application of a proposal, for `applyProposalBySig()`. */
    async signApplyProposal(input) {
        if (this.walletClient == null) {
            throw new Error('Connected wallet cannot sign typed data.');
        }
        const account = await getWalletAccount(this.walletClient);
        return await this.walletClient.signTypedData({
            account,
            domain: this.getTypedDataDomain(),
            primaryType: 'ApplyProposal',
            types: {
                ApplyProposal: [
                    { name: 'proposalKey', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            },
            message: {
                ...input,
                proposalKey: BigInt(input.proposalKey),
                deadline: BigInt(input.deadline)
            }
        });
    }
    /** Submit a proposal signed by another account. */
    async proposeBySig(input) {
        const ops = input.operations.map(operation => ({
            index: operation.index != null && operation.index !== ''
                ? BigInt(operation.index)
                : 0n,
            target: operation.target ?? zeroAddress,
            data: operation.data,
            value: BigInt(operation.value ?? '0'),
            processed: false
        }));
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'proposeBySig',
            args: [
                input.cid,
                ops,
                input.nonce,
                BigInt(input.deadline),
                input.signature
            ],
            clients: this.getClients()
        });
        await tx.wait();
        return tx;
    }
    /** Read the next signature nonce of an account. */
    async getNonce(account) {
        const contract = this.contract ??
            getContractInstance({
                address: this.address,
                abi: ProcedureContractABI.abi,
                ...this.getClients()
            });
        return (await contract.read.getNonce([account]));
    }
    /** EIP-712 domain of the signatures of this procedure. */
    getTypedDataDomain() {
        return {
            name: 'Organigram Procedure',
            version: '1',
            chainId: BigInt(this.chainId),
            verifyingContract: this.address
        };
    }
    /**
     * Turn a contract call, such as the result of `Organ.populateTransaction()`,
     * into a proposal operation.
     */
    static createOperation({ to, data, value = 0, index = 0 }) {
        return {
            index: index.toString(),
            target: to,
            data,
            value: value.toString(),
            functionSelector: data.slice(0, 10)
        };
    }
    /**
     * Build an operation that makes an organ call a contract outside the organization.
     */
    static createExternalCallOperation({ organAddress, target, data, value = 0, index = 0 }) {
        return Procedure.createOperation({
            to: organAddress,
            index,
            data: encodeFunctionData({
                abi: [
                    {
                        type: 'function',
                        name: 'executeWhitelisted',
                        stateMutability: 'nonpayable',
                        inputs: [
                            { name: 'target', type: 'address' },
                            { name: 'value', type: 'uint256' },
                            { name: 'data', type: 'bytes' }
                        ],
                        outputs: []
                    }
                ],
                functionName: 'executeWhitelisted',
                args: [target, BigInt(value), data]
            })
        });
    }
    /** Block a proposal as a moderator, before its decision. */
    async blockProposal(proposalKey, reason, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'blockProposal',
            args: [BigInt(proposalKey), reason],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Block proposal ${proposalKey} of procedure ${this.address}`);
        return await tx.wait();
    }
    /** Block a proposal signed by a moderator. */
    async blockProposalBySig(input, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'blockProposalBySig',
            args: [
                BigInt(input.proposalKey),
                input.reason,
                input.nonce,
                BigInt(input.deadline),
                input.signature
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Block proposal ${input.proposalKey} of procedure ${this.address} by signature`);
        return await tx.wait();
    }
    /** Present a proposal to the deciders, as a moderator. */
    async presentProposal(proposalKey, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'presentProposal',
            args: [BigInt(proposalKey)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Present proposal ${proposalKey} of procedure ${this.address}`);
        return await tx.wait();
    }
    /** Present a proposal signed by a moderator. */
    async presentProposalBySig(input, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'presentProposalBySig',
            args: [
                BigInt(input.proposalKey),
                input.nonce,
                BigInt(input.deadline),
                input.signature
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Present proposal ${input.proposalKey} of procedure ${this.address} by signature`);
        return await tx.wait();
    }
    /**
     * Settle a proposal: for a vote, count the ballots once it is over, then run or close it.
     */
    async applyProposal(proposalKey, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'applyProposal',
            args: [BigInt(proposalKey)],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Apply proposal ${proposalKey} of procedure ${this.address}`);
        return await tx.wait();
    }
    /** Settle a proposal, with an application signed by another account. */
    async applyProposalBySig(input, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'applyProposalBySig',
            args: [
                BigInt(input.proposalKey),
                input.nonce,
                BigInt(input.deadline),
                input.signature
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Apply proposal ${input.proposalKey} of procedure ${this.address} by signature`);
        return await tx.wait();
    }
    /** Read every proposal again from chain. */
    async reloadProposals() {
        this.proposals = await Procedure.loadProposals(this.address, this.getClients());
        return this;
    }
    /** Read one proposal again from chain. */
    async reloadProposal(proposalKey) {
        const proposal = await Procedure.loadProposal(this.address, proposalKey, this.getClients());
        this.proposals = this.proposals.map(existingProposal => existingProposal.key === proposalKey ? proposal : existingProposal);
        return this;
    }
    /** Read the roles and metadata reference again from chain. */
    async reloadData() {
        const data = await Procedure.loadData(this.address, this.getClients());
        this.cid = data.cid;
        this.proposers = data.proposers;
        this.moderators = data.moderators;
        this.deciders = data.deciders;
        this.withModeration = data.withModeration;
        return this;
    }
    /** Convert the procedure into plain JSON. */
    toJson = () => JSON.parse(JSON.stringify({
        address: this.address,
        salt: this.salt,
        organigramId: this.organigramId,
        chainId: this.chainId,
        data: this.data,
        typeName: this.typeName,
        name: this.name,
        description: this.description,
        cid: this.cid,
        isDeployed: this.isDeployed,
        deciders: this.deciders,
        proposers: this.proposers,
        moderators: this.moderators ?? zeroAddress,
        withModeration: this.withModeration,
        forwarder: this.forwarder,
        metadata: this.metadata,
        proposals: this.proposals,
        type: this.type
    }, handleJsonBigInt));
}
