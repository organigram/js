import OrganLibraryContractABI from '@organigram/protocol/abi/OrganLibrary.sol/OrganLibrary.json' with { type: 'json' };
import OrganigramClientContractABI from '@organigram/protocol/abi/OrganigramClient.sol/OrganigramClient.json' with { type: 'json' };
import ProcedureContractABI from '@organigram/protocol/abi/Procedure.sol/Procedure.json' with { type: 'json' };
import { decodeEventLog, isAddress, parseEther, toHex, zeroAddress } from 'viem';
import { createRandom32BytesHexId, deployedAddresses, formatSalt, PERMISSIONS } from './utils';
import { Organ } from './organ';
import { Procedure } from './procedure';
import { Organigram } from './organigram';
import { getProcedureClass, populateInitializeProcedure, prepareDeployOrgansInput, prepareDeployProceduresInput, procedureTypes } from './procedure/utils';
import { Asset, ERC20_INITIAL_SUPPLY } from './asset';
import { createContractWriteTransaction, createDeployTransaction, getContractInstance, getWalletAddress } from './contracts';
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
const getDeploymentAddresses = (receipt, eventName) => receipt.logs.flatMap(log => {
    try {
        const decoded = decodeEventLog({
            abi: OrganigramClientContractABI.abi,
            data: log.data,
            topics: log.topics,
            eventName
        });
        const args = decoded.args;
        if (args == null || Array.isArray(args)) {
            return [];
        }
        const objectArgs = args;
        switch (decoded.eventName) {
            case 'organDeployed':
                return [objectArgs.organ];
            case 'assetDeployed':
                return [objectArgs.asset];
            case 'procedureDeployed':
                return [objectArgs.procedure];
        }
        return [];
    }
    catch {
        return [];
    }
});
const createInitialProcedureInput = (input, chainId) => ({
    typeName: input.typeName,
    type: procedureTypes[input.typeName],
    chainId,
    cid: input.cid ?? '',
    deciders: input.deciders,
    proposers: input.proposers ?? input.deciders,
    moderators: input.moderators ?? zeroAddress,
    withModeration: input.withModeration ?? false,
    forwarder: input.forwarder ?? deployedAddresses[chainId]?.MetaGasStation,
    salt: formatSalt(input.salt),
    ...(input.data != null ? { data: input.data } : {})
});
export class OrganigramClient {
    address;
    chainId;
    procedureTypes;
    organs;
    procedures;
    assets;
    cids;
    publicClient;
    contract;
    walletClient;
    constructor(input) {
        const resolvedChainId = input.chainId ?? '11155111';
        const resolvedAddress = input.address ??
            input.contract?.address ??
            deployedAddresses[resolvedChainId]?.OrganigramClient;
        if (input.contract == null && !resolvedAddress) {
            throw new Error('OrganigramClient address not configured. Provide an address or a chainId with deployments.');
        }
        this.address = resolvedAddress ?? '';
        this.chainId = resolvedChainId;
        this.procedureTypes = input.procedureTypes ?? Object.values(procedureTypes);
        this.organs = [];
        this.procedures = [];
        this.assets = [];
        this.cids = [];
        this.walletClient = input.walletClient;
        this.publicClient = input.publicClient;
        this.contract =
            input.contract ??
                getContractInstance({
                    address: resolvedAddress,
                    abi: OrganigramClientContractABI.abi,
                    publicClient: input.publicClient,
                    walletClient: input.walletClient
                });
    }
    getClients() {
        return {
            publicClient: this.publicClient,
            walletClient: this.walletClient
        };
    }
    static async deployClient(input) {
        const { publicClient, walletClient } = input;
        const organLibraryTx = await createDeployTransaction({
            abi: OrganLibraryContractABI.abi,
            bytecode: OrganLibraryContractABI.bytecode.object,
            clients: { publicClient, walletClient }
        });
        const organLibraryReceipt = await organLibraryTx.wait();
        if (organLibraryReceipt.contractAddress == null) {
            throw new Error('Organ library deployment failed.');
        }
        const linkedBytecode = linkContractBytecode(OrganigramClientContractABI.bytecode.object, OrganigramClientContractABI.bytecode.linkReferences, {
            OrganLibrary: organLibraryReceipt.contractAddress
        });
        const clientTx = await createDeployTransaction({
            abi: OrganigramClientContractABI.abi,
            bytecode: linkedBytecode,
            args: ['', zeroAddress, createRandom32BytesHexId()],
            clients: { publicClient, walletClient }
        });
        const clientReceipt = await clientTx.wait();
        if (clientReceipt.contractAddress == null) {
            throw new Error('OrganigramClient deployment failed.');
        }
        return new OrganigramClient({
            publicClient,
            walletClient,
            chainId: String(await publicClient.getChainId()),
            address: clientReceipt.contractAddress
        });
    }
    static async loadProcedureType({ addr, cid }, publicClient) {
        const contract = getContractInstance({
            address: addr,
            abi: ProcedureContractABI.abi,
            publicClient
        });
        let metadata;
        if (!(await contract.read.supportsInterface(['0x01ffc9a7']))) {
            throw new Error('Contract does not support interfaces.');
        }
        if (!(await contract.read.supportsInterface([Procedure.INTERFACE]))) {
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
    static async loadProcedureTypes({ address, publicClient }) {
        const chainId = String(await publicClient.getChainId());
        const contract = getContractInstance({
            address: address ?? deployedAddresses[chainId].OrganigramClient,
            abi: OrganigramClientContractABI.abi,
            publicClient
        });
        const proceduresRegistryAddress = (await contract.read.proceduresRegistry());
        const procedures = await Organ.loadEntries(proceduresRegistryAddress, {
            publicClient
        });
        const loadedProcedureTypes = await Promise.all(procedures.map(async (procedure) => await OrganigramClient.loadProcedureType({
            addr: procedure.address,
            cid: procedure.cid
        }, publicClient)));
        return loadedProcedureTypes.filter((type) => type != null);
    }
    static async load(input) {
        const chainId = await input.publicClient
            .getChainId()
            .then(String)
            .catch(() => '');
        const contract = getContractInstance({
            address: input.address ??
                deployedAddresses[chainId].OrganigramClient,
            abi: OrganigramClientContractABI.abi,
            publicClient: input.publicClient,
            walletClient: input.walletClient
        });
        const loadedProcedureTypes = await OrganigramClient.loadProcedureTypes({
            address: input.address,
            publicClient: input.publicClient
        });
        return new OrganigramClient({
            chainId,
            procedureTypes: loadedProcedureTypes,
            contract,
            publicClient: input.publicClient,
            walletClient: input.walletClient
        });
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
        const code = await this.publicClient.getBytecode({
            address: procedureAddress
        });
        const type = `0x${code?.substring(22, 62)}`.toLowerCase();
        const procedureType = this.procedureTypes.find(pt => pt.address.toLowerCase() === type);
        if (procedureType == null) {
            throw new Error('getProcedureType: Procedure not supported.');
        }
        return procedureType;
    }
    async getDeployedOrgan(address, cached = true, initialOrgan) {
        const index = this.organs.findIndex(organ => organ.address.toLowerCase() === address.toLowerCase() &&
            organ.chainId === this.chainId);
        let organ = cached && index >= 0 ? this.organs[index] : undefined;
        if (organ == null) {
            organ = await Organ.load(address, this.getClients(), initialOrgan).catch((error) => {
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
        const index = this.assets.findIndex(asset => asset.address.toLowerCase() === address.toLowerCase() &&
            asset.chainId === this.chainId);
        let asset = cached && index >= 0 ? this.assets[index] : undefined;
        if (asset == null) {
            asset = await Asset.load(address, this.getClients(), initialAsset).catch((error) => {
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
            (await this.getProcedureType(address).catch((error) => {
                console.error(error.message);
                return null;
            }));
        if (procedureType == null) {
            throw new Error('getDeployedProcedure: Procedure not supported.');
        }
        let procedure = cached
            ? this.procedures.find(existingProcedure => existingProcedure.address === address)
            : undefined;
        if (procedure == null) {
            const ProcedureClass = await getProcedureClass(procedureType.key);
            procedure = await ProcedureClass.load(address, this.getClients(), initialProcedure)
                .then((loadedProcedure) => Object.assign(loadedProcedure, { type: procedureType }))
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
        if (this.walletClient == null) {
            throw new Error('Wallet client not connected.');
        }
        const { cid, permissions, salt, entries, options } = input ?? {};
        const resolvedSalt = formatSalt(salt);
        const permissionAddresses = [];
        const permissionValues = [];
        if (!permissions || permissions.length === 0) {
            permissionAddresses.push(await getWalletAddress(this.walletClient));
            permissionValues.push(toHex(PERMISSIONS.ADMIN).replace(/^0x/, '0x'));
            permissionValues[0] =
                permissionValues[0].length === 6
                    ? permissionValues[0]
                    : `0x${permissionValues[0].slice(2).padStart(4, '0')}`;
        }
        permissions?.forEach(permission => {
            permissionAddresses.push(permission.permissionAddress);
            permissionValues.push(`0x${toHex(permission.permissionValue).slice(2).padStart(4, '0')}`);
        });
        const formattedEntries = entries?.map(entry => ({
            addr: entry.address,
            cid: entry.cid ?? ''
        })) ?? [];
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployOrgan',
            args: [
                permissionAddresses,
                permissionValues,
                cid ?? '',
                formattedEntries,
                resolvedSalt
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Deploy organ with CID ${cid?.toString()}`);
        const receipt = await tx.wait();
        const organAddress = getDeploymentAddresses(receipt, 'organDeployed')[0];
        if (organAddress == null) {
            throw new Error('Organ creation failed.');
        }
        return await this.getDeployedOrgan(organAddress, false).catch((error) => {
            console.error('Unable to load organ with address ' +
                organAddress +
                ' after creating it.', error.message);
            return { address: organAddress };
        });
    }
    async deployOrgans(deployOrgansInput) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployOrgans',
            args: [prepareDeployOrgansInput(deployOrgansInput)],
            clients: this.getClients()
        });
        const receipt = await tx.wait();
        const addresses = getDeploymentAddresses(receipt, 'organDeployed');
        if (addresses.length === 0) {
            throw new Error('Organ deployment failed.');
        }
        return await Promise.all(addresses.map(async (organAddress) => await this.getDeployedOrgan(organAddress, false).catch((error) => {
            console.error('Unable to load organ with address ' +
                organAddress +
                ' after deploying it in batch.', error.message);
            return { address: organAddress };
        })));
    }
    async deployAsset(name, symbol, initialSupply, salt, options) {
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployAsset',
            args: [
                name,
                symbol,
                parseEther(initialSupply.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
                formatSalt(salt)
            ],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Create asset ${name} (${symbol})`);
        const receipt = await tx.wait();
        const assetAddress = getDeploymentAddresses(receipt, 'assetDeployed')[0];
        if (assetAddress == null) {
            throw new Error('Asset creation failed.');
        }
        return assetAddress;
    }
    async deployAssets(assets, options) {
        const formattedAssets = assets.map(asset => ({
            name: asset.name,
            symbol: asset.symbol,
            initialSupply: parseEther(asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
            salt: formatSalt(asset.salt)
        }));
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployAssets',
            args: [formattedAssets],
            clients: this.getClients(),
            nonce: options?.nonce
        });
        options?.onTransaction?.(tx, `Deploy ${assets.length} assets`);
        const receipt = await tx.wait();
        const addresses = getDeploymentAddresses(receipt, 'assetDeployed');
        if (addresses.length === 0) {
            throw new Error('Asset batch deployments failed.');
        }
        return [...new Set(addresses)];
    }
    async deployProcedure(input) {
        if (this.walletClient == null) {
            throw new Error('Wallet client not connected.');
        }
        const initialProcedure = createInitialProcedureInput(input, this.chainId);
        const initializeProcedure = await populateInitializeProcedure({
            typeName: input.typeName,
            options: input.options ?? {},
            cid: input.cid ?? '',
            deciders: input.deciders,
            proposers: input.proposers ?? input.deciders,
            moderators: input.moderators ?? zeroAddress,
            withModeration: input.withModeration ?? false,
            forwarder: input.forwarder ??
                deployedAddresses[this.chainId]?.MetaGasStation,
            args: input.args ?? []
        }, this.getClients());
        const typeAddress = procedureTypes[input.typeName].address;
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployProcedure',
            args: [typeAddress, initializeProcedure.data, formatSalt(input.salt)],
            clients: this.getClients(),
            nonce: input.options?.nonce
        });
        input.options?.onTransaction?.(tx, `Deploy procedure of type ${this.procedureTypes.find(procedureType => procedureType.address.toLowerCase() === typeAddress.toLowerCase())?.metadata.label ?? typeAddress}.`);
        const receipt = await tx.wait();
        const procedureAddress = getDeploymentAddresses(receipt, 'procedureDeployed')[0];
        if (procedureAddress == null) {
            throw new Error('Procedure deployment failed.');
        }
        return await this.getDeployedProcedure(procedureAddress, false, {
            ...initialProcedure,
            address: procedureAddress
        }).catch((error) => {
            throw new Error('Unable to load procedure with address ' +
                procedureAddress +
                ' after creating it.' +
                error.message);
        });
    }
    async deployProcedures(deployProceduresInput) {
        const input = await prepareDeployProceduresInput(deployProceduresInput, this.getClients());
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployProcedures',
            args: [input],
            clients: this.getClients()
        });
        const receipt = await tx.wait();
        const addresses = getDeploymentAddresses(receipt, 'procedureDeployed');
        if (addresses.length === 0) {
            throw new Error('Procedure batch creations failed.');
        }
        return await Promise.all(addresses.map(async (procedureAddress, index) => {
            const currentInput = deployProceduresInput[index];
            const initialProcedure = currentInput != null
                ? {
                    ...createInitialProcedureInput(currentInput, this.chainId),
                    address: procedureAddress
                }
                : undefined;
            return await this.getDeployedProcedure(procedureAddress, false, initialProcedure).catch((error) => {
                console.error('Unable to load procedure with address ' +
                    procedureAddress +
                    ' after creating it.', error.message);
                return { address: procedureAddress };
            });
        }));
    }
    async deployOrganigram(input) {
        if (this.walletClient == null) {
            throw new Error('Wallet client not connected.');
        }
        const formattedAssets = input.assets.map(asset => ({
            name: asset.name,
            symbol: asset.symbol,
            initialSupply: parseEther(asset.initialSupply?.toString() ?? ERC20_INITIAL_SUPPLY.toString()),
            salt: formatSalt(asset.salt)
        }));
        const organsInput = prepareDeployOrgansInput(input.organs);
        const proceduresInput = await prepareDeployProceduresInput(input.procedures, this.getClients());
        const tx = await createContractWriteTransaction({
            address: this.address,
            abi: OrganigramClientContractABI.abi,
            functionName: 'deployOrganigram',
            args: [organsInput, formattedAssets, proceduresInput],
            clients: this.getClients()
        });
        const receipt = await tx.wait();
        return [
            getDeploymentAddresses(receipt, 'organDeployed'),
            getDeploymentAddresses(receipt, 'assetDeployed'),
            getDeploymentAddresses(receipt, 'procedureDeployed')
        ];
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
                !isAddress(organ.address)) {
                return organ;
            }
            try {
                return ((await this.getDeployedOrgan(organ.address, false, organ)) ??
                    organ);
            }
            catch (error) {
                console.warn('Unable to hydrate deployed organ in organigram load.', organ.address, error.message);
                return organ;
            }
        })).filter(organ => organ != null);
        const deployedProcedures = await this.mapWithConcurrencyLimit(organigram.procedures, loadConcurrency, async (procedure) => {
            if (!procedure.isDeployed ||
                !procedure.address ||
                !isAddress(procedure.address)) {
                return procedure;
            }
            try {
                return ((await this.getDeployedProcedure(procedure.address, false, procedure)) ?? procedure);
            }
            catch (error) {
                console.warn('Unable to hydrate deployed procedure in organigram load.', procedure.address, error.message);
                return procedure;
            }
        });
        const deployedAssets = (await this.mapWithConcurrencyLimit(organigram.assets, loadConcurrency, async (asset) => {
            if (!asset.isDeployed ||
                !asset.address ||
                !isAddress(asset.address)) {
                return asset;
            }
            try {
                return ((await this.getDeployedAsset(asset.address, false, asset)) ??
                    asset);
            }
            catch (error) {
                console.warn('Unable to hydrate deployed asset in organigram load.', asset.address, error.message);
                return asset;
            }
        })).filter(asset => asset != null);
        return new Organigram({
            ...organigram,
            organs: deployedOrgans,
            procedures: deployedProcedures,
            assets: deployedAssets,
            organigramClient: this,
            publicClient: this.publicClient,
            walletClient: this.walletClient
        });
    }
}
export default OrganigramClient;
