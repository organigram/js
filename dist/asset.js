import AssetContract from '@organigram/protocol/artifacts/contracts/Asset.sol/Asset.json';
import { ethers, Interface, formatEther } from 'ethers';
export const ERC20_INITIAL_SUPPLY = 10_000_000;
export const getAssetData = async (assetAddress, signer) => {
    if (assetAddress == null || assetAddress === '' || signer == null) {
        return undefined;
    }
    const erc777Interface = new Interface(AssetContract.abi);
    const contract = new ethers.Contract(assetAddress, erc777Interface, signer);
    const name = await contract.name();
    const symbol = await contract.symbol();
    const _totalSupply = await contract.totalSupply();
    let totalSupply = formatEther(_totalSupply);
    totalSupply = (+totalSupply).toFixed(0);
    const _userBalance = await contract.balanceOf(signer.getAddress());
    let userBalance = formatEther(_userBalance);
    userBalance = (+userBalance).toFixed(0);
    if (contract != null) {
        return { contract, name, symbol, totalSupply, userBalance };
    }
};
export const deployERC20 = async (signer) => {
    const erc777Interface = new ethers.Interface(AssetContract.abi);
    const factory = new ethers.ContractFactory(erc777Interface, AssetContract.bytecode, signer);
    const contract = await factory.deploy(BigInt(ERC20_INITIAL_SUPPLY));
    await contract.waitForDeployment();
    return contract;
};
