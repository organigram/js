import AssetContract from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json';
import { ethers, formatEther } from 'ethers';
import { createRandom32BytesHexId, predictContractAddress } from './utils';
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
    static load = async (address, signer, initilAsset) => {
        if (!address) {
            throw new Error('Cannot load asset: No address provided.');
        }
        const contract = new ethers.Contract(address, AssetContract.abi, signer);
        const name = await contract.name();
        const symbol = await contract.symbol();
        const _initialSupply = await contract.totalSupply();
        const initialSupply = parseInt((+formatEther(_initialSupply)).toFixed(0));
        const _userBalance = (await contract.balanceOf(await signer?.getAddress())) ?? 0;
        let userBalance = formatEther(_userBalance);
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
                chainId: (await signer?.provider?.getNetwork())?.chainId.toString(),
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
