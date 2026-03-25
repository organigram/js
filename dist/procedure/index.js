import ProcedureContractABI from '@organigram/protocol/abi/Procedure.sol/Procedure.json';
import { decodeAbiParameters, decodeFunctionResult, encodeAbiParameters, encodeFunctionData, encodePacked, keccak256, parseAbiParameters, toFunctionSelector, toHex, zeroAddress } from 'viem';
import { capitalize, createRandom32BytesHexId, deployedAddresses, handleJsonBigInt, predictContractAddress } from '../utils';
import { tryMulticall } from '../multicall';
import { ProcedureTypeNameEnum, procedureTypes } from './utils';
import { createContractWriteTransaction, getContractInstance, getWalletAccount, } from '../contracts';
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
        funcSig: '0xa9059cbb',
        key: 'withdrawEther',
        signature: 'transfer(address,uint256)',
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
    }
];
export class Procedure {
    static INTERFACE = '0x71dbd330';
    static OPERATIONS_FUNCTIONS = procedureFunctions;
    name;
    description;
    address;
    typeName;
    cid;
    isDeployed;
    deciders;
    proposers;
    withModeration;
    moderators;
    metadata;
    data;
    forwarder;
    proposals;
    contract;
    salt;
    chainId;
    walletClient;
    publicClient;
    organigramId;
    type;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, publicClient, walletClient, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, type, data, organigramId }) {
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
                    chainId: chainId ?? '11155111',
                    salt: this.salt
                });
        this.deciders = deciders;
        this.typeName = typeName;
        this.isDeployed = isDeployed ?? false;
        this.cid = cid ?? this.typeName;
        this.name = name ?? 'Unnamed procedure';
        this.description = description ?? '';
        this.chainId = chainId ?? '11155111';
        this.organigramId = organigramId ?? 'default-organigram-id';
        this.metadata = metadata ?? '{}';
        this.proposers = proposers ?? deciders;
        this.moderators = moderators ?? zeroAddress;
        this.withModeration = withModeration ?? false;
        this.forwarder =
            forwarder ?? deployedAddresses[this.chainId]?.MetaGasStation;
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
        this.type =
            type ?? procedureTypes[this.typeName];
        this.data = data ?? '';
    }
    getClients() {
        if (this.publicClient == null) {
            throw new Error('Public client not connected.');
        }
        return {
            publicClient: this.publicClient,
            walletClient: this.walletClient
        };
    }
    static async _populateInitialize(_populateInitializeInput, _clients) {
        throw new Error('Procedure cannot be initialized.');
    }
    static async loadData(address, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        return normalizeProcedureData(await contract.read.getProcedure());
    }
    static async loadProposal(address, proposalKey, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        const proposal = await contract.read.getProposal([BigInt(proposalKey)]);
        return normalizeProposal(proposal, proposalKey);
    }
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
    static async load(address, clients, initialProcedure) {
        if (!address) {
            throw new Error('No address provided.');
        }
        const chainId = initialProcedure?.chainId ?? String(await clients.publicClient.getChainId());
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
            forwarder: initialProcedure?.forwarder ??
                deployedAddresses[chainId]?.MetaGasStation,
            proposals,
            isDeployed: true
        });
    }
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
    static async isProcedure(address, clients) {
        const contract = getContractInstance({
            address,
            abi: ProcedureContractABI.abi,
            publicClient: clients.publicClient
        });
        return Boolean(await contract.read.supportsInterface(['0x01ffc9a7']));
    }
    async updateCid(cid, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'updateCid',
            args: [cid],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Update metadata of procedure ${this.address} with CID ${cid.toString()}`);
        return tx;
    }
    async updateAdmin(address, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: ProcedureContractABI.abi,
            functionName: 'updateAdmin',
            args: [address],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Update admin of procedure ${this.address} to ${address}.`);
        return tx;
    }
    async propose(input) {
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
        const proposalKey = receipt.logs[0]?.topics?.[2];
        if (proposalKey == null) {
            throw new Error('Proposal not created.');
        }
        const proposal = await Procedure.loadProposal(this.address, proposalKey, this.getClients());
        this.proposals.push(proposal);
        return proposal;
    }
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
    async getNonce(account) {
        const contract = this.contract ??
            getContractInstance({
                address: this.address,
                abi: ProcedureContractABI.abi,
                ...this.getClients()
            });
        return await contract.read.getNonce([account]);
    }
    getTypedDataDomain() {
        return {
            name: 'Organigram Procedure',
            version: '1',
            chainId: BigInt(this.chainId),
            verifyingContract: this.address
        };
    }
    static createExternalCallOperation({ organAddress, target, data, value = 0, index = 0 }) {
        return {
            index: index.toString(),
            target: organAddress,
            value: '0',
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
                args: [
                    target,
                    BigInt(value),
                    data
                ]
            }),
            functionSelector: toFunctionSelector('executeWhitelisted(address,uint256,bytes)')
        };
    }
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
    async reloadProposals() {
        this.proposals = await Procedure.loadProposals(this.address, this.getClients());
        return this;
    }
    async reloadProposal(proposalKey) {
        const proposal = await Procedure.loadProposal(this.address, proposalKey, this.getClients());
        this.proposals = this.proposals.map(existingProposal => existingProposal.key === proposalKey ? proposal : existingProposal);
        return this;
    }
    async reloadData() {
        const data = await Procedure.loadData(this.address, this.getClients());
        this.cid = data.cid;
        this.proposers = data.proposers;
        this.moderators = data.moderators;
        this.deciders = data.deciders;
        this.withModeration = data.withModeration;
        return this;
    }
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
