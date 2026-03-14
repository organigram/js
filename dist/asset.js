import AssetContract from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json';
import { ethers, formatEther } from 'ethers';
import { createRandom32BytesHexId, predictContractAddress } from './utils';
import { getProviderFromSignerOrProvider, tryMulticall } from './multicall';
export const ERC20_INITIAL_SUPPLY = 10_000_000;
export class Asset {
    address;
    name;
    description;
    symbol;
    initialSupply;
    chainId;
    salt;
    image;
    isDeployed;
    userBalance;
    organigramId;
    constructor(input) {
        if (!input.address && !input.chainId) {
            throw new Error('Either address or chainId must be provided to organ constructor.');
        }
        this.name = input.name ?? 'Unnamed asset';
        this.description = input.description ?? 'This asset has no description.';
        this.isDeployed = input.isDeployed ?? false;
        this.salt =
            input.salt || (this.isDeployed ? undefined : createRandom32BytesHexId());
        this.chainId = input.chainId ?? '11155111';
        this.address =
            input.address ??
                predictContractAddress({
                    type: 'Asset',
                    chainId: this.chainId,
                    salt: this.salt
                });
        this.symbol = input.symbol ?? 'ASSET';
        this.initialSupply = input.initialSupply ?? ERC20_INITIAL_SUPPLY;
        this.image = input.image ?? undefined;
        this.userBalance = input.userBalance ?? '0';
        this.organigramId = input.organigramId ?? null;
    }
    static load = async (address, signerOrProvider, initilAsset) => {
        if (!address) {
            throw new Error('Cannot load asset: No address provided.');
        }
        const provider = getProviderFromSignerOrProvider(signerOrProvider);
        const contract = new ethers.Contract(address, AssetContract.abi, signerOrProvider ?? provider);
        const signerAddress = signerOrProvider != null && 'getAddress' in signerOrProvider
            ? await signerOrProvider.getAddress()
            : undefined;
        const contractInterface = new ethers.Interface(AssetContract.abi);
        const multicallValues = await tryMulticall(signerOrProvider ?? provider, [
            {
                target: address,
                callData: contractInterface.encodeFunctionData('name'),
                decode: returnData => contractInterface.decodeFunctionResult('name', returnData)[0]
            },
            {
                target: address,
                callData: contractInterface.encodeFunctionData('symbol'),
                decode: returnData => contractInterface.decodeFunctionResult('symbol', returnData)[0]
            },
            {
                target: address,
                callData: contractInterface.encodeFunctionData('totalSupply'),
                decode: returnData => contractInterface.decodeFunctionResult('totalSupply', returnData)[0]
            },
            {
                target: address,
                callData: contractInterface.encodeFunctionData('balanceOf', [
                    signerAddress ?? ethers.ZeroAddress
                ]),
                decode: returnData => contractInterface.decodeFunctionResult('balanceOf', returnData)[0]
            }
        ]);
        const [name, symbol, initialSupplyRaw, userBalanceRaw, chainId] = multicallValues != null
            ? await Promise.all([
                Promise.resolve(multicallValues[0]),
                Promise.resolve(multicallValues[1]),
                Promise.resolve(multicallValues[2]),
                Promise.resolve(multicallValues[3] ?? 0),
                initilAsset?.chainId != null
                    ? Promise.resolve(initilAsset.chainId)
                    : provider?.getNetwork().then(network => network.chainId.toString())
            ])
            : await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.totalSupply(),
                signerAddress != null ? contract.balanceOf(signerAddress) : 0,
                initilAsset?.chainId != null
                    ? Promise.resolve(initilAsset.chainId)
                    : provider?.getNetwork().then(network => network.chainId.toString())
            ]);
        const initialSupply = parseInt((+formatEther(initialSupplyRaw)).toFixed(0));
        let userBalance = formatEther(userBalanceRaw);
        userBalance = (+userBalance).toFixed(0);
        if (contract != null) {
            return new Asset({
                ...initilAsset,
                address,
                contract,
                name,
                symbol,
                initialSupply,
                userBalance,
                chainId: chainId,
                isDeployed: true
            });
        }
    };
    toJson() {
        return {
            address: this.address,
            name: this.name,
            symbol: this.symbol,
            initialSupply: this.initialSupply,
            chainId: this.chainId,
            salt: this.salt,
            image: this.image,
            isDeployed: this.isDeployed,
            userBalance: this.userBalance,
            organigramId: this.organigramId
        };
    }
}
