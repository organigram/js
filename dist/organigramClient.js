import { ethers } from 'ethers';
import OrganigramClientContractABI from '@organigram/protocol/artifacts/contracts/OrganigramClient.sol/OrganigramClient.json';
import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json';
import { createRandom32BytesHexId, deployedAddresses, formatSalt, PERMISSIONS } from './utils';
import Organ from './organ';
import { Procedure } from './procedure';
import { erc20Vote, ERC20VoteProcedure } from './procedure/erc20Vote';
import { nomination, NominationProcedure } from './procedure/nomination';
import { vote, VoteProcedure } from './procedure/vote';
export const procedureTypes = {
    erc20Vote,
    nomination,
    vote
};
const _procedureClasses = {
    erc20Vote: ERC20VoteProcedure,
    nomination: NominationProcedure,
    vote: VoteProcedure
};
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
    constructor(input) {
        this.address =
            input?.address ??
                deployedAddresses[input?.chainId]?.OrganigramClient ??
                '';
        this.chainId = input?.chainId ?? '11155111';
        this.procedureTypes = input?.procedureTypes ?? Object.values(procedureTypes);
        this.organs = [];
        this.procedures = [];
        this.cids = [];
        this.signer = input?.signer;
        this.provider = input?.provider;
        this.contract =
            input?.contract ??
                new ethers.Contract(input?.address ?? '', OrganigramClientContractABI.abi, input?.signer ?? input?.provider);
    }
    static async loadProcedureType({ addr, cid }, provider) {
        const contract = new ethers.Contract(addr, ProcedureContractABI.abi, provider);
        let metadata;
        if (!(await contract.supportsInterface('0x01ffc9a7'))) {
            throw new Error('Contract does not support interfaces.');
        }
        if (!(await contract.supportsInterface(Procedure.INTERFACE))) {
            throw new Error('Contract is not a procedure.');
        }
        if (cid === 'nomination' || cid === 'vote' || cid === 'erc20Vote') {
            metadata = procedureTypes[cid].metadata;
        }
        return {
            key: cid ?? '',
            address: addr,
            metadata: {
                ...metadata,
                cid
            }
        };
    }
    static async loadProcedureTypes(provider) {
        const chainId = await provider.getNetwork().then(n => n.chainId.toString());
        const contract = new ethers.Contract(deployedAddresses[chainId].OrganigramClient, OrganigramClientContractABI.abi, provider);
        const proceduresRegistryAddress = (await contract.proceduresRegistry()).toString();
        const procedures = await Organ.loadEntries(proceduresRegistryAddress, provider);
        const procedureTypes = await Promise.all(procedures.map(async (procedure) => await OrganigramClient.loadProcedureType({
            addr: procedure.address,
            cid: procedure.cid
        }, provider))).then((types) => types.filter(i => i != null));
        return procedureTypes;
    }
    static async load(input) {
        if (input.provider == null && input.signer == null) {
            throw new Error('No provider or signer.');
        }
        const chainId = await input.provider
            .getNetwork()
            .then(n => n.chainId.toString())
            .catch(() => '');
        const contract = new ethers.Contract(deployedAddresses[chainId].OrganigramClient, OrganigramClientContractABI.abi, input.signer ?? input.provider);
        const procedureTypes = await OrganigramClient.loadProcedureTypes(input.provider);
        const newOrganigram = new OrganigramClient({
            chainId,
            procedureTypes,
            contract,
            provider: input.provider,
            signer: input.signer
        });
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
            const _Class = _procedureClasses[procedureType.key];
            procedure = await _Class
                .load(address, signerOrProvider)
                .then((p) => Object.assign(p, { type: procedureType }))
                .catch((error) => {
                console.error('Unable to load procedure.', error.message);
                return undefined;
            });
            if (procedure != null) {
                this.procedures.push(procedure);
            }
        }
        if (procedure == null) {
            throw new Error('Procedure not found.');
        }
        return procedure;
    }
    async deployOrgan(input) {
        const { cid, permissions, salt, entries, options } = input ?? {};
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
        if (!permissions || permissions.length === 0) {
            const address = await this.signer.getAddress();
            _permissionAddresses.push(address);
            _permissionValues.push(ethers.zeroPadValue(ethers.toBeHex(PERMISSIONS.ADMIN), 2));
        }
        permissions?.forEach((p) => {
            _permissionAddresses.push(p.permissionAddress);
            _permissionValues.push(ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2));
        });
        const _entries = entries?.map((e) => ({
            addr: e.address,
            cid: e.cid ?? ''
        })) ?? [];
        const tx = await this.contract.deployOrgan(_permissionAddresses, _permissionValues, cid ?? '', _entries, _salt, {
            nonce,
            customData: options?.customData
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Deploy organ with CID ${cid?.toString()}`);
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
            organ.permissions?.forEach(p => {
                _permissionAddresses.push(p.permissionAddress);
                _permissionValues.push(ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2));
            });
            return {
                permissionAddresses: _permissionAddresses,
                permissionValues: _permissionValues,
                cid: organ.cid ?? '',
                salt: organ.salt ?? createRandom32BytesHexId()
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
        const tx = await this.contract.deployAsset(name, symbol, initialSupply, formatSalt(salt));
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
            customData: options?.customData,
            nonce: options?.nonce != null ? BigInt(options.nonce) : undefined
        });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Deploy ${assets.length} assets`);
        }
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Asset batch deployments failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return addresses;
    }
    async _deployProcedure({ typeAddress, initialize, salt, options }) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        let nonce;
        if (options?.nonce != null) {
            nonce = BigInt(options?.nonce);
        }
        const _salt = formatSalt(salt);
        const tx = await this.contract.deployProcedure(typeAddress, initialize?.data, _salt, { nonce, customData: options?.customData });
        if (options?.onTransaction != null) {
            options.onTransaction(tx, `Deploy procedure of type ${this.procedureTypes?.find(pt => pt.address.toLowerCase() === typeAddress.toLowerCase())?.metadata.label ?? typeAddress}.`);
        }
        const receipt = await tx?.wait();
        const address = receipt?.logs?.find((e) => e.address !== this.address).address;
        if (address == null) {
            throw new Error('Procedure deployment failed.');
        }
        return address;
    }
    async _populateInitializeProcedure(input) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const procedureClass = _procedureClasses[input.typeName];
        if (procedureClass == null) {
            throw new Error('Populate initialize procedure: Procedure type not found.');
        }
        try {
            return await procedureClass._populateInitialize({
                options: { ...input.options, signer: this.signer },
                cid: input.cid ?? input.typeName,
                proposers: input.proposers ?? input.deciders,
                moderators: input.moderators ?? ethers.ZeroAddress,
                deciders: input.deciders,
                withModeration: input.withModeration ?? false,
                forwarder: input.forwarder ??
                    deployedAddresses[this.chainId]?.MetaGasStation,
                args: input.args
            });
        }
        catch (error) {
            console.error('populateInitializeProcedure', error.message);
            throw error;
        }
    }
    async deployProcedure(input) {
        const initializeProcedure = await this._populateInitializeProcedure({
            typeName: input.typeName,
            options: input.options ?? {},
            cid: input.cid ?? input.typeName,
            deciders: input.deciders,
            proposers: input.proposers ?? input.deciders,
            moderators: input.moderators ?? ethers.ZeroAddress,
            withModeration: input.withModeration ?? false,
            forwarder: input.forwarder ??
                deployedAddresses[this.chainId]?.MetaGasStation,
            args: input.args ?? []
        });
        const address = await this._deployProcedure({
            typeAddress: procedureTypes[input.typeName].address,
            initialize: initializeProcedure,
            salt: input.salt ?? createRandom32BytesHexId(),
            options: input.options ?? {}
        });
        return await this.getProcedure(address, false).catch((error) => {
            throw new Error('Unable to load procedure with address ' +
                address +
                ' after creating it.' +
                error.message);
        });
    }
    async _prepareDeployProceduresInput(deployProceduresInput) {
        return await Promise.all(deployProceduresInput.map(async (procedure) => {
            if (procedure.typeName !== 'nomination' &&
                procedure.data == null &&
                procedure.args == null) {
                throw new Error('At least one of "data" or "args" fields must be present in ' +
                    procedure.typeName +
                    ' procedure input.');
            }
            const parsedData = procedure.data ? JSON.parse(procedure.data) : {};
            const _args = procedure.args ?? Object.values(parsedData);
            const initialize = await this._populateInitializeProcedure({
                typeName: procedure.typeName,
                options: procedure.options ?? {},
                cid: procedure.cid ?? procedure.typeName,
                moderators: procedure.moderators ?? ethers.ZeroAddress,
                deciders: procedure.deciders,
                proposers: procedure.proposers ?? procedure.deciders,
                withModeration: procedure.withModeration ?? false,
                forwarder: deployedAddresses[procedure.chainId]?.MetaGasStation,
                args: _args
            });
            return {
                procedureType: procedureTypes[procedure.typeName]
                    .address,
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
        const organsInput = this._prepareDeployOrgansInput(input.organs);
        const proceduresInput = await this._prepareDeployProceduresInput(input.procedures);
        const deployedAddresses = await this.contract.deployOrganigram.staticCall(organsInput, formattedAssets, proceduresInput);
        const tx = await this.contract.deployOrganigram(organsInput, formattedAssets, proceduresInput);
        await tx?.wait();
        return deployedAddresses;
    }
    loadOrganigram(organigram, cached = true, options = {
        discover: true,
        limit: 100
    }) {
        return organigram;
    }
}
export default OrganigramClient;
