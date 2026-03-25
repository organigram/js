import { getAddress, getContract } from 'viem';
const requireWalletClient = (clients) => {
    if (clients.walletClient == null) {
        throw new Error('Wallet client not connected.');
    }
    return clients.walletClient;
};
export const getWalletAccount = async (walletClient) => {
    if (walletClient.account != null)
        return walletClient.account;
    const [address] = await walletClient.getAddresses();
    if (address == null) {
        throw new Error('Wallet client account not available.');
    }
    return address;
};
export const getWalletAddress = async (walletClient) => {
    const account = await getWalletAccount(walletClient);
    return typeof account === 'string' ? account : account.address;
};
const getTransactionChain = (walletClient) => (walletClient.chain ?? null);
const createTransaction = (publicClient, hash) => ({
    hash,
    wait: async () => {
        const [receipt, transaction] = await Promise.all([
            publicClient.waitForTransactionReceipt({ hash }),
            publicClient.getTransaction({ hash }).catch(() => null)
        ]);
        return {
            ...receipt,
            gasPrice: transaction?.gasPrice ?? receipt.effectiveGasPrice ?? null
        };
    }
});
export const getContractInstance = ({ address, abi, publicClient, walletClient }) => getContract({
    address: getAddress(address),
    abi: abi,
    client: walletClient != null
        ? { public: publicClient, wallet: walletClient }
        : publicClient
});
export const createContractWriteTransaction = async ({ address, abi, functionName, args, clients, nonce, value }) => {
    const walletClient = requireWalletClient(clients);
    const account = await getWalletAccount(walletClient);
    const hash = await walletClient.writeContract({
        address: getAddress(address),
        abi: abi,
        functionName: functionName,
        args: (args ?? []),
        account,
        chain: getTransactionChain(walletClient),
        ...(nonce != null ? { nonce } : {}),
        ...(value != null ? { value } : {})
    });
    return createTransaction(clients.publicClient, hash);
};
export const createDeployTransaction = async ({ abi, bytecode, args, clients, nonce, value }) => {
    const walletClient = requireWalletClient(clients);
    const account = await getWalletAccount(walletClient);
    const hash = await walletClient.deployContract({
        abi: abi,
        bytecode: bytecode,
        args: (args ?? []),
        account,
        chain: getTransactionChain(walletClient),
        ...(nonce != null ? { nonce } : {}),
        ...(value != null ? { value } : {})
    });
    return createTransaction(clients.publicClient, hash);
};
