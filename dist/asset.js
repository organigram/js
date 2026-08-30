import AssetContract from '@organigram/protocol/abi/Asset.sol/Asset.json' with { type: 'json' };
import { decodeFunctionResult, encodeFunctionData, formatUnits, zeroAddress } from 'viem';
import { createRandom32BytesHexId, predictContractAddress } from './utils';
import { getDefaultChainId } from './deployments';
import { tryMulticall } from './multicall';
import { getContractInstance, getWalletAddress } from './contracts';
export const ERC20_INITIAL_SUPPLY = 10_000_000; // 10 million tokens.
/**
 * In-memory representation of one ERC-20 asset managed by an organigram.
 */
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
    kind;
    decisionProcedure;
    constructor(input) {
        if (!input.address && !input.chainId) {
            throw new Error('Either address or chainId must be provided to organ constructor.');
        }
        this.name = input.name ?? 'Unnamed asset';
        this.description = input.description ?? 'This asset has no description.';
        this.isDeployed = input.isDeployed ?? false;
        this.salt =
            input.salt || (this.isDeployed ? undefined : createRandom32BytesHexId());
        this.chainId = input.chainId ?? getDefaultChainId();
        this.kind = input.kind ?? 'asset';
        this.address =
            input.address ??
                predictContractAddress({
                    type: this.kind === 'equity' ? 'EquityToken' : 'Asset',
                    chainId: this.chainId,
                    salt: this.salt
                });
        this.symbol = input.symbol ?? 'ASSET';
        this.initialSupply = input.initialSupply ?? ERC20_INITIAL_SUPPLY;
        this.image = input.image ?? undefined;
        this.userBalance = input.userBalance ?? '0';
        this.organigramId = input.organigramId ?? null;
        this.decisionProcedure = input.decisionProcedure ?? null;
    }
    /**
     * Hydrate an asset from chain state.
     *
     * @param address Asset contract address.
     * @param clients viem clients used to query the contract.
     * @param initialAsset Optional fallback metadata merged into the loaded asset.
     */
    static load = async (address, clients, initialAsset) => {
        if (!address) {
            throw new Error('Cannot load asset: No address provided.');
        }
        const contract = getContractInstance({
            address,
            abi: AssetContract.abi,
            ...clients
        });
        const walletAddress = clients.walletClient != null
            ? await getWalletAddress(clients.walletClient)
            : undefined;
        const multicallValues = await tryMulticall(clients, [
            {
                target: address,
                callData: encodeFunctionData({
                    abi: AssetContract.abi,
                    functionName: 'decimals'
                }),
                decode: returnData => decodeFunctionResult({
                    abi: AssetContract.abi,
                    functionName: 'decimals',
                    data: returnData
                })
            },
            {
                target: address,
                callData: encodeFunctionData({
                    abi: AssetContract.abi,
                    functionName: 'name'
                }),
                decode: returnData => decodeFunctionResult({
                    abi: AssetContract.abi,
                    functionName: 'name',
                    data: returnData
                })
            },
            {
                target: address,
                callData: encodeFunctionData({
                    abi: AssetContract.abi,
                    functionName: 'symbol'
                }),
                decode: returnData => decodeFunctionResult({
                    abi: AssetContract.abi,
                    functionName: 'symbol',
                    data: returnData
                })
            },
            {
                target: address,
                callData: encodeFunctionData({
                    abi: AssetContract.abi,
                    functionName: 'totalSupply'
                }),
                decode: returnData => decodeFunctionResult({
                    abi: AssetContract.abi,
                    functionName: 'totalSupply',
                    data: returnData
                })
            },
            {
                target: address,
                callData: encodeFunctionData({
                    abi: AssetContract.abi,
                    functionName: 'balanceOf',
                    args: [walletAddress ?? zeroAddress]
                }),
                decode: returnData => decodeFunctionResult({
                    abi: AssetContract.abi,
                    functionName: 'balanceOf',
                    data: returnData
                })
            }
        ]);
        const loadedValues = multicallValues != null
            ? await Promise.all([
                Promise.resolve(multicallValues[0]),
                Promise.resolve(multicallValues[1]),
                Promise.resolve(multicallValues[2]),
                Promise.resolve(multicallValues[3]),
                Promise.resolve((multicallValues[4] ?? 0n)),
                initialAsset?.chainId != null
                    ? Promise.resolve(initialAsset.chainId)
                    : clients.publicClient.getChainId().then(String)
            ])
            : await Promise.all([
                Promise.resolve((await contract.read.name())),
                Promise.resolve((await contract.read.symbol())),
                Promise.resolve((await contract.read.totalSupply())),
                Promise.resolve((await contract.read.decimals())),
                walletAddress != null
                    ? Promise.resolve((await contract.read.balanceOf([walletAddress])))
                    : Promise.resolve(0n),
                initialAsset?.chainId != null
                    ? Promise.resolve(initialAsset.chainId)
                    : clients.publicClient.getChainId().then(String)
            ]);
        const [name, symbol, initialSupplyRaw, decimals, userBalanceRaw, chainId] = loadedValues;
        const initialSupply = parseInt((+formatUnits(initialSupplyRaw, decimals)).toFixed(0));
        let userBalance = formatUnits(userBalanceRaw, decimals);
        userBalance = (+userBalance).toFixed(0);
        return new Asset({
            ...initialAsset,
            address,
            name,
            symbol,
            initialSupply,
            userBalance,
            chainId,
            isDeployed: true
        });
    };
    /**
     * Convert the asset into a JSON-safe structure.
     */
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
            organigramId: this.organigramId,
            kind: this.kind,
            decisionProcedure: this.decisionProcedure,
        };
    }
}
