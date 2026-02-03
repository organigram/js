import { ethers } from 'ethers';
import OrganigramContractABI from '@organigram/protocol/artifacts/contracts/OrganigramClient.sol/OrganigramClient.json';
import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json';
import { formatSalt } from './utils';
import Organ from './organ';
import { Procedure } from './procedure';
import { NominationProcedure } from './procedure/nomination';
import { VoteProcedure } from './procedure/vote';
import { ERC20VoteProcedure } from './procedure/erc20Vote';
import { getOrganSourcesAndTargets, getProcedureSourcesAndTargets } from './organigram';
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
        Class: NominationProcedure
    },
    {
        key: 'vote',
        address: '',
        metadata: { ...procedureMetadata, name: 'Vote', type: 'vote' },
        Class: VoteProcedure
    },
    {
        key: 'erc20Vote',
        address: '',
        metadata: { ...procedureMetadata, name: 'ERC20 Vote', type: 'erc20Vote' },
        Class: ERC20VoteProcedure
    }
];
export class OrganigramClient {
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
        const contract = new ethers.Contract(addr, ProcedureContractABI.abi, provider);
        let Class;
        let metadata;
        let name = '';
        if (!(await contract.supportsInterface('0x01ffc9a7'))) {
            throw new Error('Contract does not support interfaces.');
        }
        if (!(await contract.supportsInterface(Procedure.INTERFACE))) {
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
        const contract = new ethers.Contract(address, OrganigramContractABI.abi, provider);
        const proceduresRegistryAddress = (await contract.proceduresRegistry()).toString();
        const procedures = await Organ.loadEntries(proceduresRegistryAddress, provider);
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
        const contract = new ethers.Contract(address, OrganigramContractABI.abi, signer ?? provider);
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
            organ = await Organ.load(address, this.signer ?? this.provider).catch((error) => {
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
    async deployOrgan({ metadata, permissions, salt, options }) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        let nonce;
        if (options?.nonce != null) {
            nonce = BigInt(options?.nonce ?? 0);
        }
        const _salt = formatSalt(salt);
        const _permissionAddresses = [];
        const _permissionValues = [];
        permissions.forEach((p) => {
            _permissionAddresses.push(p.permissionAddress);
            _permissionValues.push(p.permissionValue);
        });
        const tx = await this.contract.deployOrgan(_permissionAddresses, _permissionValues, metadata, _salt, {
            nonce,
            customData: options?.customData
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Deploy organ with CID ${metadata.toString()}`);
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
    _prepareDeployOrgansInput(deployOrgansInput) {
        return deployOrgansInput.map(organ => {
            const _permissionAddresses = [];
            const _permissionValues = [];
            organ.permissions.forEach(p => {
                _permissionAddresses.push(p.permissionAddress);
                _permissionValues.push(p.permissionValue);
            });
            return {
                permissionAddresses: _permissionAddresses,
                permissionValues: _permissionValues,
                cid: organ.metadata,
                salt: formatSalt(organ.salt)
            };
        });
    }
    async deployOrgans(deployOrgansInput) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const input = this._prepareDeployOrgansInput(deployOrgansInput);
        const tx = await this.contract.deployOrgans(input);
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Organ deployment failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return await Promise.all(addresses.map(async (address) => await this.getOrgan(address, false).catch((error) => {
            console.error('Unable to load organ with address ' +
                address +
                ' after deploying it in batch.', error.message);
            return { address };
        })));
    }
    async deployAsset(name, symbol, initialSupply, salt, options) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        let nonce;
        if (options?.nonce != null) {
            nonce = BigInt(options?.nonce);
        }
        const tx = await this.contract.deployAsset(name, symbol, initialSupply, formatSalt(salt), {
            nonce,
            customData: options?.customData
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Create asset ${name} (${symbol})`);
        }
        const receipt = await tx?.wait();
        const address = receipt?.logs?.find((e) => e.address !== this.address).address;
        if (address == null) {
            throw new Error('Asset creation failed.');
        }
        return address;
    }
    async deployAssets(assets, options) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const formattedAssets = assets.map(asset => ({
            name: asset.name,
            symbol: asset.symbol,
            initialSupply: asset.initialSupply,
            salt: formatSalt(asset.salt)
        }));
        const tx = await this.contract.deployAssets(formattedAssets, {
            customData: options?.customData
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Create ${assets.length} assets`);
        }
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Asset batch deployments failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return addresses;
    }
    async _deployProcedure({ type, initialize, salt, options }) {
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
        const _salt = formatSalt(salt);
        const tx = await this.contract.deployProcedure(procedureType.address, initialize?.data, _salt, { nonce, customData: options?.customData });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Deploy procedure of type ${procedureType.name}`);
        }
        const receipt = await tx?.wait();
        const address = receipt?.logs?.find((e) => e.address !== this.address).address;
        if (address == null) {
            throw new Error('Procedure deployment failed.');
        }
        return await this.getProcedure(address, true).catch((error) => {
            console.error('Unable to load procedure with address ' +
                address +
                ' after deploying it.', error.message);
            return { address };
        });
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
    async deployProcedure(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, salt, ...args) {
        const initializeProcedure = await this._populateInitializeProcedure(type, options, cid, proposers, moderators, deciders, withModeration, forwarder, ...args);
        const { address } = await this._deployProcedure({
            type,
            initialize: initializeProcedure,
            salt,
            options
        });
        return await this.getProcedure(address, false).catch((error) => {
            console.error('Unable to load procedure with address ' +
                address +
                ' after creating it.', error.message);
            return { address };
        });
    }
    async _prepareDeployProceduresInput(deployProceduresInput) {
        return await Promise.all(deployProceduresInput.map(async (procedure) => {
            const initialize = await this._populateInitializeProcedure(procedure.type, procedure.options ?? {}, procedure.cid, procedure.proposers, procedure.moderators, procedure.deciders, procedure.withModeration, procedure.forwarder, ...(procedure.args ?? []));
            return {
                procedureType: procedure.type,
                data: initialize.data,
                salt: formatSalt(procedure.salt),
                options: procedure.options
            };
        }));
    }
    async deployProcedures(deployProceduresInput) {
        const input = await this._prepareDeployProceduresInput(deployProceduresInput);
        const tx = await this.contract.deployProcedures(input, {});
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Procedure batch creations failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return await Promise.all(addresses.map(async (address) => await this.getProcedure(address, false).catch((error) => {
            console.error('Unable to load procedure with address ' +
                address +
                ' after creating it.', error.message);
            return { address };
        })));
    }
    async deployOrganigram(input) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const formattedAssets = input.assets.map(asset => ({
            name: asset.name,
            symbol: asset.symbol,
            initialSupply: asset.initialSupply,
            salt: formatSalt(asset.salt)
        }));
        const organsInput = await this._prepareDeployOrgansInput(input.organs);
        const proceduresInput = await this._prepareDeployProceduresInput(input.procedures);
        const tx = await this.contract.deployOrganigram(organsInput, formattedAssets, proceduresInput);
        return tx;
    }
    loadOrganigram(organigram, cached = true, options = {
        discover: true,
        limit: 100
    }) {
        organigram.organs = [];
        this.contract
            .getOrgans()
            .then(async (organAddresses) => {
            for (const address of organAddresses) {
                const organ = await this.getOrgan(address, cached).catch((error) => {
                    console.error('Error loading organ ' + address, error.message);
                    return undefined;
                });
                if (organ != null) {
                    organigram.organs.push(getOrganSourcesAndTargets(organ));
                }
            }
        })
            .catch((error) => {
            console.error('Error fetching organs', error.message);
        });
        organigram.procedures = [];
        this.contract
            .getProcedures()
            .then(async (procedureAddresses) => {
            for (const address of procedureAddresses) {
                const procedure = await this.getProcedure(address, cached).catch((error) => {
                    console.error('Error loading procedure ' + address, error.message);
                    return undefined;
                });
                if (procedure != null) {
                    organigram.procedures.push(getProcedureSourcesAndTargets(procedure));
                }
            }
        })
            .catch((error) => {
            console.error('Error fetching procedures', error.message);
        });
        return organigram;
    }
}
export default OrganigramClient;
