"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganigramClient = void 0;
const ethers_1 = require("ethers");
const Organigram_json_1 = __importDefault(require("@organigram/protocol/abi/Organigram.json"));
const Procedure_json_1 = __importDefault(require("@organigram/protocol/abi/Procedure.json"));
const organ_1 = __importDefault(require("./organ"));
const procedure_1 = __importDefault(require("./procedure"));
const nomination_1 = __importDefault(require("./procedure/nomination"));
const vote_1 = __importDefault(require("./procedure/vote"));
const erc20Vote_1 = __importDefault(require("./procedure/erc20Vote"));
const procedureMetadata = {
    description: '',
    _type: 'procedureType',
    _generator: 'https://organigram.ai',
    _generatedAt: 0
};
const procedures = [
    {
        key: 'nomination',
        address: '',
        metadata: { ...procedureMetadata, name: 'Nomination', type: 'nomination' },
        Class: nomination_1.default
    },
    {
        key: 'vote',
        address: '',
        metadata: { ...procedureMetadata, name: 'Vote', type: 'vote' },
        Class: vote_1.default
    },
    {
        key: 'erc20Vote',
        address: '',
        metadata: { ...procedureMetadata, name: 'ERC20 Vote', type: 'erc20Vote' },
        Class: erc20Vote_1.default
    }
];
class OrganigramClient {
    address;
    chainId;
    procedureTypes;
    organs;
    procedures;
    cids;
    provider;
    contract;
    signer;
    constructor(address, chainId, procedureTypes, contract, provider, signer) {
        this.address = address;
        this.chainId = chainId;
        this.procedureTypes = procedureTypes;
        this.organs = [];
        this.procedures = [];
        this.cids = [];
        this.signer = signer;
        this.provider = provider;
        this.contract = contract;
    }
    static async loadProcedureType({ addr, cid }, provider) {
        const contract = new ethers_1.ethers.Contract(addr, Procedure_json_1.default, provider);
        let Class;
        let metadata;
        let name = '';
        if (!(await contract.supportsInterface('0x01ffc9a7'))) {
            throw new Error('Contract does not support interfaces.');
        }
        if (!(await contract.supportsInterface(procedure_1.default.INTERFACE))) {
            throw new Error('Contract is not a procedure.');
        }
        if (cid === 'nomination' || cid === 'vote' || cid === 'erc20Vote') {
            metadata = procedures.find(p => p.key === cid)?.metadata;
            Class = procedures.find(p => p.key === cid)?.Class;
            name =
                metadata?.name != null && metadata.name !== '' ? metadata.name : name;
        }
        return {
            name,
            key: cid ?? '',
            address: addr,
            metadata: {
                ...metadata,
                cid
            },
            Class
        };
    }
    static async loadProcedureTypes(address, provider) {
        const contract = new ethers_1.ethers.Contract(address, Organigram_json_1.default, provider);
        const proceduresRegistry = (await contract.procedures()).toString();
        const procedures = await organ_1.default.loadEntries(proceduresRegistry, provider);
        const procedureTypes = await Promise.all(procedures.map(async (procedure) => await OrganigramClient.loadProcedureType({
            addr: procedure.address,
            cid: procedure.cid
        }, provider))).then((types) => types.filter(i => i != null));
        return procedureTypes;
    }
    static async load(address, provider, signer) {
        if (provider == null && signer == null) {
            throw new Error('No provider or signer.');
        }
        const contract = new ethers_1.ethers.Contract(address, Organigram_json_1.default, signer ?? provider);
        const procedureTypes = await OrganigramClient.loadProcedureTypes(address, provider);
        const chainId = await provider
            ?.getNetwork()
            .then(n => n.chainId.toString())
            .catch(() => '');
        const newOrganigram = new OrganigramClient(address, chainId, procedureTypes, contract, provider, signer);
        return newOrganigram;
    }
    async getProcedureType(procedureAddress) {
        if (this.provider == null) {
            throw new Error('No provider.');
        }
        const code = await this.provider.getCode(procedureAddress).catch(() => '0x');
        const type = `0x${code.substring(22, 62)}`.toLowerCase();
        const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type);
        return procedureType ?? null;
    }
    async getOrgan(address, cached = true) {
        const index = this.organs.findIndex(c => c.address.toLowerCase() === address.toLowerCase() &&
            c.chainId === this.chainId);
        let organ = cached && index > 0 ? this.organs[parseInt(index.toString())] : undefined;
        if (organ == null && this.provider != null) {
            organ = await organ_1.default.load(address, this.signer ?? this.provider).catch((error) => {
                console.error('Error loading organ ', address, error.message);
                return undefined;
            });
            if (organ != null) {
                if (index >= 0) {
                    this.organs[parseInt(index.toString())] = organ;
                }
                else {
                    this.organs.push(organ);
                }
            }
        }
        if (organ == null) {
            throw new Error('Organ not found.');
        }
        return organ;
    }
    async getProcedure(address, cached = true) {
        const procedureType = await this.getProcedureType(address).catch((e) => {
            console.error(e.message);
            return null;
        });
        if (procedureType == null) {
            throw new Error('Procedure not supported.');
        }
        let procedure = cached && this.procedures.find(c => c.address === address);
        if (procedure == null || procedure === false) {
            const signerOrProvider = this.signer ?? this.provider;
            if (signerOrProvider == null) {
                throw new Error('Not connected.');
            }
            const _Class = procedureType.Class;
            procedure = await _Class
                .load(address, signerOrProvider)
                .then((p) => Object.assign(p, { type: procedureType }))
                .catch((error) => {
                console.error('Unable to load procedure.', error.message);
                return undefined;
            });
            if (procedure != null) {
                procedure.type = procedureType;
                this.procedures.push(procedure);
            }
        }
        if (procedure == null) {
            throw new Error('Procedure not found.');
        }
        return procedure;
    }
    async getContract(address, cached = true) {
        return (await organ_1.default.isOrgan(address, this.provider))
            ? await this.getOrgan(address, cached)
            : (await procedure_1.default.isProcedure(address, this.provider))
                ? await this.getProcedure(address, cached)
                : null;
    }
    async createOrgan(metadata, admin, options) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        let nonce;
        if (options?.nonce != null) {
            nonce = BigInt(options?.nonce);
        }
        const tx = await this.contract.createOrgan(admin, metadata, {
            nonce
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Create organ with CID ${metadata.toString()}`);
        }
        const receipt = await tx?.wait();
        const eventCreation = receipt?.logs?.find((e) => e.address !== this.address);
        if (eventCreation == null) {
            throw new Error('Organ creation failed.');
        }
        const address = eventCreation.address;
        return await this.getOrgan(address, false).catch((error) => {
            console.error('Unable to load organ with address ' + address + ' after creating it.', error.message);
            return { address };
        });
    }
    async _createProcedure(type, initialize, options) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type.toLowerCase());
        if (procedureType?.Class == null) {
            throw new Error('Procedure type not found.');
        }
        let nonce;
        if (options?.nonce != null) {
            nonce = BigInt(options?.nonce);
        }
        const tx = await this.contract.createProcedure(procedureType.address, initialize?.data, { nonce });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Create procedure of type ${procedureType.name}`);
        }
        const receipt = await tx?.wait();
        const address = receipt?.logs?.find((e) => e.address !== this.address).address;
        if (address == null) {
            throw new Error('Procedure creation failed.');
        }
        return await this.getProcedure(address, true).catch((error) => {
            console.error('Unable to load procedure with address ' +
                address +
                ' after creating it.', error.message);
            return { address };
        });
    }
    async _initializeProcedure(address, type, options, metadata, proposers, moderators, deciders, withModeration, forwarder, ...args) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const initialize = await this._populateInitializeProcedure(type, options, metadata, proposers, moderators, deciders, withModeration, forwarder, ...args);
        if (initialize?.data == null) {
            throw new Error('Could not initialize procedure.');
        }
        const tx = await this.signer.sendTransaction({
            from: this.signer.getAddress(),
            to: address,
            data: initialize.data
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Initialize procedure ${address}`);
        }
        await tx.wait();
        return await this.getProcedure(address, true);
    }
    async _populateInitializeProcedure(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, ...args) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type.toLowerCase());
        if (procedureType?.Class == null) {
            throw new Error('Procedure type not found.');
        }
        const _Class = procedureType.Class;
        try {
            return await _Class._populateInitialize(type, { ...options, signer: this.signer }, cid, proposers, moderators, deciders, withModeration, forwarder, ...args);
        }
        catch (error) {
            console.error('initialize', error.message);
            throw error;
        }
    }
    async createProcedure(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, ...args) {
        const initializeProcedure = await this._populateInitializeProcedure(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, ...args);
        const { address } = await this._createProcedure(type, initializeProcedure, options);
        return await this.getProcedure(address, false).catch((error) => {
            console.error('Unable to load procedure with address ' +
                address +
                ' after creating it.', error.message);
            return { address };
        });
    }
}
exports.OrganigramClient = OrganigramClient;
exports.default = OrganigramClient;
