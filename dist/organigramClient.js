import { ethers, parseEther } from 'ethers';
import OrganLibraryContractABI from '@organigram/protocol/artifacts/contracts/libraries/OrganLibrary.sol/OrganLibrary.json';
import OrganigramClientContractABI from '@organigram/protocol/artifacts/contracts/OrganigramClient.sol/OrganigramClient.json';
import ProcedureContractABI from '@organigram/protocol/artifacts/contracts/Procedure.sol/Procedure.json';
import { createRandom32BytesHexId, deployedAddresses, formatSalt, PERMISSIONS } from './utils';
import { Organ } from './organ';
import { Procedure } from './procedure';
import { Organigram } from './organigram';
import { getProcedureClass, populateInitializeProcedure, prepareDeployOrgansInput, prepareDeployProceduresInput, procedureTypes } from './procedure/utils';
import { Asset, ERC20_INITIAL_SUPPLY } from './asset';
const linkContractBytecode = (bytecode, linkReferences, libraries) => {
    let linkedBytecode = bytecode;
    for (const contracts of Object.values(linkReferences)) {
        for (const [name, references] of Object.entries(contracts)) {
            const address = libraries[name];
            if (address == null) {
                throw new Error(`Missing linked library address for ${name}.`);
            }
            const normalizedAddress = address.toLowerCase().slice(2);
            for (const reference of references) {
                const start = 2 + reference.start * 2;
                const end = start + reference.length * 2;
                linkedBytecode =
                    linkedBytecode.slice(0, start) +
                        normalizedAddress +
                        linkedBytecode.slice(end);
            }
        }
    }
    return linkedBytecode;
};
export class OrganigramClient {
    address;
    chainId;
    procedureTypes;
    organs;
    procedures;
    assets;
    cids;
    provider;
    contract;
    signer;
    constructor(input) {
        const resolvedChainId = input?.chainId ?? '11155111';
        const resolvedAddress = input?.address ??
            input?.contract?.target ??
            deployedAddresses[resolvedChainId]?.OrganigramClient;
        if (input?.contract == null && !resolvedAddress) {
            throw new Error('OrganigramClient address not configured. Provide an address or a chainId with deployments.');
        }
        this.address = resolvedAddress ?? '';
        this.chainId = resolvedChainId;
        this.procedureTypes = input?.procedureTypes ?? Object.values(procedureTypes);
        this.organs = [];
        this.procedures = [];
        this.assets = [];
        this.cids = [];
        this.signer = input?.signer;
        this.provider = input?.provider;
        this.contract =
            input?.contract ??
                new ethers.Contract(resolvedAddress, OrganigramClientContractABI.abi, input?.signer ?? input?.provider);
    }
    static async deployClient(signer) {
        const network = await signer.provider?.getNetwork();
        const organLibraryFactory = new ethers.ContractFactory(OrganLibraryContractABI.abi, OrganLibraryContractABI.bytecode, signer);
        const organLibrary = await organLibraryFactory.deploy();
        await organLibrary.waitForDeployment();
        const linkedBytecode = linkContractBytecode(OrganigramClientContractABI.bytecode, OrganigramClientContractABI.linkReferences, {
            OrganLibrary: await organLibrary.getAddress()
        });
        const factory = new ethers.ContractFactory(OrganigramClientContractABI.abi, linkedBytecode, signer);
        const contract = await factory.deploy('', ethers.ZeroAddress, createRandom32BytesHexId());
        await contract.waitForDeployment();
        const clientContract = new ethers.Contract(await contract.getAddress(), OrganigramClientContractABI.abi, signer);
        return new OrganigramClient({
            provider: signer.provider,
            signer,
            chainId: network?.chainId.toString(),
            contract: clientContract
        });
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
    static async loadProcedureTypes({ address, provider }) {
        const chainId = await provider.getNetwork().then(n => n.chainId.toString());
        const contract = new ethers.Contract(address ?? deployedAddresses[chainId].OrganigramClient, OrganigramClientContractABI.abi, provider);
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
        const contract = new ethers.Contract(input.address ??
            deployedAddresses[chainId].OrganigramClient, OrganigramClientContractABI.abi, input.signer ?? input.provider);
        const procedureTypes = await OrganigramClient.loadProcedureTypes(input.provider);
        const newOrganigramClient = new OrganigramClient({
            chainId,
            procedureTypes,
            contract,
            provider: input.provider,
            signer: input.signer
        });
        return newOrganigramClient;
    }
    async mapWithConcurrencyLimit(values, limit, callback) {
        const results = new Array(values.length);
        let nextIndex = 0;
        const workers = Array.from({
            length: Math.max(1, Math.min(limit, values.length))
        }).map(async () => {
            while (nextIndex < values.length) {
                const currentIndex = nextIndex;
                nextIndex += 1;
                results[currentIndex] = await callback(values[currentIndex], currentIndex);
            }
        });
        await Promise.all(workers);
        return results;
    }
    async getProcedureType(procedureAddress) {
        if (this.provider == null || this.signer == null) {
            throw new Error('No provider or signer.');
        }
        const code = await (this.provider ?? this.signer.provider)?.getCode(procedureAddress);
        const type = `0x${code?.substring(22, 62)}`.toLowerCase();
        const procedureType = this.procedureTypes.find((pt) => pt.address.toLowerCase() === type);
        if (procedureType == null) {
            throw new Error('getProcedureType: Procedure not supported.');
        }
        return procedureType;
    }
    async getDeployedOrgan(address, cached = true, initialOrgan) {
        const index = this.organs.findIndex(c => c.address.toLowerCase() === address.toLowerCase() &&
            c.chainId === this.chainId);
        let organ = cached && index >= 0 ? this.organs[index] : undefined;
        if (organ == null && this.provider != null) {
            organ = await Organ.load(address, this.signer ?? this.provider, initialOrgan).catch((error) => {
                console.error('Error loading organ ', address, error.message);
                return undefined;
            });
            if (organ != null) {
                if (index >= 0) {
                    this.organs[index] = organ;
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
    async getDeployedAsset(address, cached = true, initialAsset) {
        const index = this.assets.findIndex(c => c.address.toLowerCase() === address.toLowerCase() &&
            c.chainId === this.chainId);
        let asset = cached && index >= 0 ? this.assets[index] : undefined;
        if (asset == null && this.provider != null) {
            asset = await Asset.load(address, this.signer ?? this.provider, initialAsset).catch((error) => {
                console.error('Error loading asset ', address, error.message);
                return undefined;
            });
            if (asset != null) {
                if (index >= 0) {
                    this.assets[index] = asset;
                }
                else {
                    this.assets.push(asset);
                }
            }
        }
        if (asset == null) {
            throw new Error('Asset not found.');
        }
        return asset;
    }
    async getDeployedProcedure(address, cached = true, initialProcedure) {
        const procedureType = initialProcedure?.type ??
            procedureTypes[initialProcedure?.typeName] ??
            (await this.getProcedureType(address).catch((e) => {
                console.error(e.message);
                return null;
            }));
        if (procedureType == null) {
            throw new Error('getDeployedProcedure: Procedure not supported.');
        }
        let procedure = cached
            ? this.procedures.find(c => c.address === address)
            : undefined;
        if (procedure == null) {
            const signerOrProvider = this.signer ?? this.provider;
            if (signerOrProvider == null) {
                throw new Error('Not connected.');
            }
            const _Class = await getProcedureClass(procedureType.key);
            procedure = await _Class
                .load(address, signerOrProvider, initialProcedure)
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
        return await this.getDeployedOrgan(address, false).catch((error) => {
            console.error('Unable to load organ with address ' + address + ' after creating it.', error.message);
            return { address };
        });
    }
    async deployOrgans(deployOrgansInput) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const input = prepareDeployOrgansInput(deployOrgansInput);
        const tx = await this.contract.deployOrgans(input);
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Organ deployment failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return await Promise.all(addresses.map(async (address) => await this.getDeployedOrgan(address, false).catch((error) => {
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
        const tx = await this.contract.deployAsset(name, symbol, parseEther(initialSupply.toString() ?? ERC20_INITIAL_SUPPLY.toString()), formatSalt(salt));
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
            initialSupply: parseEther(asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
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
        const addresses = [
            ...new Set(eventCreations.map((eventCreation) => eventCreation.address))
        ];
        return addresses;
    }
    async deployProcedure(input) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const initializeProcedure = await populateInitializeProcedure({
            typeName: input.typeName,
            options: input.options ?? {},
            cid: input.cid ?? '',
            deciders: input.deciders,
            proposers: input.proposers ?? input.deciders,
            moderators: input.moderators ?? ethers.ZeroAddress,
            withModeration: input.withModeration ?? false,
            forwarder: input.forwarder ??
                deployedAddresses[this.chainId]?.MetaGasStation,
            args: input.args ?? []
        }, this.signer);
        const typeAddress = procedureTypes[input.typeName].address;
        let nonce;
        if (input.options?.nonce != null) {
            nonce = BigInt(input.options?.nonce);
        }
        const _salt = formatSalt(input.salt);
        const tx = await this.contract.deployProcedure(typeAddress, initializeProcedure?.data, _salt, { nonce, customData: input.options?.customData });
        if (input.options?.onTransaction != null) {
            input.options.onTransaction(tx, `Deploy procedure of type ${this.procedureTypes?.find(pt => pt.address.toLowerCase() === typeAddress.toLowerCase())?.metadata.label ?? typeAddress}.`);
        }
        const receipt = await tx?.wait();
        const address = receipt?.logs?.find((e) => e.address !== this.address).address;
        if (address == null) {
            throw new Error('Procedure deployment failed.');
        }
        return await this.getDeployedProcedure(address, false).catch((error) => {
            throw new Error('Unable to load procedure with address ' +
                address +
                ' after creating it.' +
                error.message);
        });
    }
    async deployProcedures(deployProceduresInput) {
        if (this.signer == null) {
            throw new Error('Signer not connected.');
        }
        const input = await prepareDeployProceduresInput(deployProceduresInput, this.signer);
        const tx = await this.contract.deployProcedures(input, {});
        const receipt = await tx?.wait();
        const eventCreations = receipt?.logs?.filter((e) => e.address !== this.address);
        if (eventCreations == null || eventCreations.length === 0) {
            throw new Error('Procedure batch creations failed.');
        }
        const addresses = eventCreations.map((eventCreation) => eventCreation.address);
        return await Promise.all(addresses.map(async (address) => await this.getDeployedProcedure(address, false).catch((error) => {
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
            initialSupply: parseEther(asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
            salt: formatSalt(asset.salt)
        }));
        const organsInput = prepareDeployOrgansInput(input.organs);
        const proceduresInput = await prepareDeployProceduresInput(input.procedures, this.signer);
        const deployedAddresses = await this.contract.deployOrganigram.staticCall(organsInput, formattedAssets, proceduresInput);
        const tx = await this.contract.deployOrganigram(organsInput, formattedAssets, proceduresInput);
        await tx?.wait();
        return deployedAddresses;
    }
    async loadContract(address, cached = true) {
        return ((await this.getDeployedOrgan(address, cached)) ??
            (await this.getDeployedProcedure(address, cached)));
    }
    async loadContracts(contractAddresses) {
        const organs = [];
        const procedures = [];
        const assets = [];
        for (const address of contractAddresses) {
            try {
                const organ = await this.getDeployedOrgan(address);
                if (organ != null) {
                    organs.push(organ);
                    continue;
                }
                const procedure = await this.getDeployedProcedure(address);
                if (procedure != null) {
                    procedures.push(procedure);
                    continue;
                }
                const asset = await this.getDeployedAsset(address);
                if (asset != null) {
                    assets.push(asset);
                    continue;
                }
                console.warn('Contract with address ' +
                    address +
                    ' not found as organ or procedure. Skipping...');
            }
            catch (error) {
                console.error('Unable to load contract with address ' + address, error.message);
            }
        }
        return new Organigram({
            organs,
            procedures,
            assets
        });
    }
    async loadOrganigram(organigram, cached = true) {
        const loadConcurrency = 4;
        const deployedOrgans = (await this.mapWithConcurrencyLimit(organigram.organs, loadConcurrency, async (organ) => {
            if (!organ.isDeployed ||
                !organ.address ||
                !ethers.isAddress(organ.address)) {
                return organ;
            }
            return ((await this.getDeployedOrgan(organ.address, cached, organ)) ?? organ);
        })).filter(organ => organ != null);
        const deployedProcedures = await this.mapWithConcurrencyLimit(organigram.procedures, loadConcurrency, async (procedure) => {
            if (!procedure.isDeployed ||
                !procedure.address ||
                !ethers.isAddress(procedure.address)) {
                return procedure;
            }
            return (this.procedures.find(p => p.address === procedure.address) ??
                (await this.getDeployedProcedure(procedure.address, cached, procedure)) ??
                procedure);
        });
        const deployedAssets = (await this.mapWithConcurrencyLimit(organigram.assets, loadConcurrency, async (asset) => {
            if (!asset.isDeployed ||
                !asset.address ||
                !ethers.isAddress(asset.address)) {
                return asset;
            }
            return ((await this.getDeployedAsset(asset.address, cached, asset)) ?? asset);
        })).filter(asset => asset != null);
        const newOrganigram = {
            ...organigram,
            organs: deployedOrgans,
            procedures: deployedProcedures,
            assets: deployedAssets
        };
        return new Organigram(newOrganigram);
    }
}
export default OrganigramClient;
