import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json';
import { ethers } from 'ethers';
import { capitalize, createRandom32BytesHexId, deployedAddresses, predictContractAddress } from '../utils';
export const procedureMetadata = {
    _type: 'procedureType',
    _generator: 'https://organigram.ai',
    _generatedAt: 0
};
export var ProcedureTypeNameEnum;
(function (ProcedureTypeNameEnum) {
    ProcedureTypeNameEnum["erc20Vote"] = "erc20Vote";
    ProcedureTypeNameEnum["nomination"] = "nomination";
    ProcedureTypeNameEnum["vote"] = "vote";
})(ProcedureTypeNameEnum || (ProcedureTypeNameEnum = {}));
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
        key: 'addProcedure',
        signature: 'addProcedure(address,bytes2)',
        label: 'Add permission',
        tags: ['procedures', 'add'],
        params: ['procedure', 'permissions'],
        target: 'organ'
    },
    {
        funcSig: '0x19b9404c',
        key: 'removeProcedure',
        signature: 'removeProcedure(address)',
        label: 'Remove permission',
        tags: ['procedures', 'remove'],
        params: ['procedure'],
        target: 'organ'
    },
    {
        funcSig: '0xd0922d4a',
        key: 'replaceProcedure',
        signature: 'replaceProcedure(address,address,bytes2)',
        label: 'Replace permission',
        tags: ['procedures', 'replace'],
        params: ['procedure', 'procedure', 'permissions'],
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
    _contract;
    salt;
    chainId;
    signer;
    provider;
    organigramId;
    sourceOrgans;
    targetOrgans;
    type;
    constructor({ address, deciders, typeName, name, description, salt, cid, chainId, signerOrProvider, metadata, proposers, withModeration, forwarder, moderators, proposals, isDeployed, sourceOrgans, targetOrgans, type, data, organigramId }) {
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
                    chainId: chainId,
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
        this.moderators = moderators ?? ethers.ZeroAddress;
        this.withModeration = withModeration ?? false;
        this.forwarder =
            forwarder ?? deployedAddresses[chainId]?.MetaGasStation;
        this.proposals = proposals ?? [];
        if (signerOrProvider?.provider != null) {
            this.signer = signerOrProvider;
            this.provider = this.signer.provider;
        }
        else {
            this.provider = signerOrProvider;
            this.signer = undefined;
            try {
                if (this.provider instanceof ethers.JsonRpcProvider) {
                    this.provider
                        .getSigner(this.address)
                        .then(signer => {
                        this.signer = signer;
                    })
                        .catch(error => {
                        console.warn('Error while getting signer from provider.', error);
                    });
                }
            }
            catch (error) { }
        }
        this._contract = new ethers.Contract(this.address, ProcedureContractABI.abi, signerOrProvider);
        this.sourceOrgans = sourceOrgans ?? [];
        this.targetOrgans = targetOrgans ?? [];
        this.type = type;
        this.data = data;
    }
    static async _populateInitialize(_populateInitializeInput) {
        throw new Error('Procedure cannot be initialized.');
    }
    static async loadData(address, signerOrProvider) {
        const contract = new ethers.Contract(address, ProcedureContractABI.abi, signerOrProvider);
        return await contract.getProcedure();
    }
    static async loadProposal(address, proposalKey, signerOrProvider) {
        const contract = new ethers.Contract(address, ProcedureContractABI.abi, signerOrProvider);
        const proposal = await contract.getProposal(proposalKey);
        const [creator, cid, blockReason, presented, blocked, adopted, applied] = proposal;
        const parsedOperations = proposal.operations.map((op) => Procedure.parseOperation(op));
        return {
            key: proposalKey,
            creator,
            cid,
            blockReason,
            presented,
            blocked,
            adopted,
            applied,
            operations: parsedOperations
        };
    }
    static async loadProposals(address, signerOrProvider) {
        const data = await Procedure.loadData(address, signerOrProvider);
        const proposalsLength = BigInt(data.proposalsLength);
        const proposals = [];
        for (let i = 0; i < proposalsLength; i++) {
            const key = i.toString();
            const proposal = await Procedure.loadProposal(address, key, signerOrProvider).catch((error) => {
                console.warn('Error while loading proposal in procedure.', address, key, error.message);
                return null;
            });
            if (proposal != null) {
                proposals.push(proposal);
            }
        }
        return proposals;
    }
    static async load(address, signerOrProvider) {
        const provider = signerOrProvider.provider ?? signerOrProvider;
        if (provider == null) {
            throw new Error('No provider found.');
        }
        const chainId = await provider
            .getNetwork()
            .then(({ chainId }) => chainId.toString())
            .catch(_err => undefined);
        if (chainId == null) {
            throw new Error('No chainId found.');
        }
        const isProcedure = await Procedure.isProcedure(address, signerOrProvider);
        if (!isProcedure) {
            throw new Error('Contract at address is not a Procedure.');
        }
        const data = await Procedure.loadData(address, signerOrProvider);
        const proposals = await Procedure.loadProposals(address, signerOrProvider);
        return new Procedure({
            cid: data.cid,
            address,
            chainId,
            signerOrProvider,
            metadata: data.metadata,
            proposers: data.proposers,
            moderators: data.moderators,
            deciders: data.deciders,
            withModeration: data.withModeration,
            forwarder: data.forwarder ??
                deployedAddresses[chainId]?.MetaGasStation,
            proposals,
            isDeployed: true,
            typeName: 'nomination'
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
            case 'permissions':
                return 'bytes2';
            case 'addresses':
                return 'address[]';
            case 'address':
                return 'address';
            case 'organ':
                return 'address';
            case 'procedure':
                return 'address';
            case 'proposal':
                return 'uint256';
            case 'proposals':
                return 'uint256';
            case 'entry':
                return '(address,string)';
            case 'entries':
                return '(address,string)[]';
            case 'amount':
                return 'uint256';
            case 'tokenId':
                return 'uint256';
            default:
                return 'uint256';
        }
    }
    static _extractParams(types, operation) {
        if (operation?.data != null) {
            const typesArray = types.map(type => Procedure._stringifyParamType(type));
            const decoder = ethers.AbiCoder.defaultAbiCoder();
            const decodedParams = decoder.decode(typesArray, `0x${operation.data.substring(10)}`);
            return types.map((type, index) => {
                let _value;
                let value = decodedParams[index];
                if (value != null && type != null) {
                    switch (type) {
                        case 'cid':
                            _value = value;
                            value = _value[0];
                            break;
                        case 'entry':
                            _value = value;
                            value = {
                                addr: _value[0],
                                cid: _value[1]
                            };
                            break;
                        case 'entries':
                            _value = value;
                            value = _value.map(e => ({
                                addr: e[0],
                                cid: e[1]
                            }));
                            break;
                        default:
                    }
                }
                return { type, value };
            });
        }
        else {
            return types.map(type => ({ type }));
        }
    }
    static parseOperation(_operation) {
        const [index, target, data, value, processed] = _operation;
        const functionSelector = data.toString().slice(0, 10);
        const operation = {
            index,
            target,
            value,
            data,
            processed,
            functionSelector
        };
        operation.function = Procedure.OPERATIONS_FUNCTIONS.find(pof => pof.funcSig === functionSelector);
        if (operation.function == null) {
            return operation;
        }
        operation.params =
            operation.function.params != null
                ? Procedure._extractParams(operation.function.params, operation)
                : [];
        return operation;
    }
    static async isProcedure(address, signerOrProvider) {
        const contract = new ethers.Contract(address, ProcedureContractABI.abi, signerOrProvider);
        const isERC165 = await contract.supportsInterface('0x01ffc9a7');
        if (!isERC165)
            return false;
        return true;
    }
    async updateCid(cid, options) {
        const tx = await this._contract.updateCid(cid);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Update metadata of procedure ${this.address} with CID ${cid.toString()}`);
        }
        return tx;
    }
    async updateAdmin(address, options) {
        const tx = await this._contract.updateAdmin(address);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Update admin of procedure ${this.address} to ${address}.`);
        }
        return tx;
    }
    async propose(input) {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const ops = input.operations.map(operation => {
            return {
                index: operation?.index != null && operation.index !== ''
                    ? operation.index
                    : '0',
                target: operation.target,
                data: operation.data,
                value: operation.value,
                processed: false
            };
        });
        const tx = await this._contract.propose(input.cid, ops);
        if (input.options?.onTransaction != null) {
            input.options.onTransaction(tx, `Create proposal with CID ${input.cid} on procedure ${this.address}`);
        }
        const receipt = await tx.wait();
        const proposalKey = receipt.logs[0].topics[2];
        if (proposalKey == null || proposalKey === '') {
            throw new Error('Proposal not created.');
        }
        const proposal = await Procedure.loadProposal(this.address, proposalKey, signerOrProvider);
        if (proposal == null) {
            throw new Error('Proposal not found.');
        }
        this.proposals.push(proposal);
        return proposal;
    }
    async blockProposal(proposalKey, reason, options) {
        const tx = await this._contract.blockProposal(proposalKey, reason);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Block proposal ${proposalKey} of procedure ${this.address}`);
        }
        return await tx.wait();
    }
    async presentProposal(proposalKey, options) {
        const tx = await this._contract.presentProposal(proposalKey);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Present proposal ${proposalKey} of procedure ${this.address}`);
        }
        return await tx.wait();
    }
    async adoptProposal(proposalKey, options) {
        const tx = await this._contract.adoptProposal(proposalKey);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Adopt proposal ${proposalKey} of procedure ${this.address}`);
        }
        return await tx.wait();
    }
    async applyProposal(proposalKey, options) {
        const tx = await this._contract.applyProposal(proposalKey);
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Apply proposal ${proposalKey} of procedure ${this.address}`);
        }
        return await tx.wait();
    }
    async reloadProposals() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const proposals = await Procedure.loadProposals(this.address, signerOrProvider);
        this.proposals = proposals;
        return this;
    }
    async reloadProposal(proposalKey) {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const proposal = await Procedure.loadProposal(this.address, proposalKey, signerOrProvider);
        const proposals = this.proposals.map(m => m.key === proposalKey ? proposal : m);
        this.proposals = proposals;
        return this;
    }
    async reloadData() {
        const signerOrProvider = this.signer ?? this.provider;
        if (signerOrProvider == null) {
            throw new Error('Not connected.');
        }
        const data = await Procedure.loadData(this.address, signerOrProvider);
        this.cid = data.cid;
        this.proposers = data.proposers;
        this.moderators = data.moderators;
        this.deciders = data.deciders;
        this.withModeration = data.withModeration;
        return this;
    }
    toJson() {
        return {
            chainId: this.chainId,
            data: this.data,
            address: this.address,
            typeName: this.typeName,
            name: this.name,
            description: this.description,
            cid: this.cid,
            isDeployed: this.isDeployed,
            deciders: this.deciders,
            proposers: this.proposers,
            moderators: this.moderators ?? ethers.ZeroAddress,
            withModeration: this.withModeration,
            forwarder: this.forwarder,
            metadata: this.metadata,
            proposals: this.proposals,
            sourceOrgans: this.sourceOrgans,
            targetOrgans: this.targetOrgans,
            type: this.type,
        };
    }
}
