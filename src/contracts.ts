import type {
  Abi,
  Account,
  Address,
  Hex,
  PublicClient,
  TransactionReceipt,
  WalletClient
} from 'viem'
import { getAddress, getContract } from 'viem'

export type ContractClients = {
  publicClient: PublicClient
  walletClient?: WalletClient | null
}

export type OrganigramTransactionReceipt = TransactionReceipt & {
  gasPrice?: bigint | null
}

export type OrganigramTransaction = {
  hash: Hex
  wait: () => Promise<OrganigramTransactionReceipt>
}

export const bufferEstimatedGas = (estimatedGas: bigint): bigint =>
  (estimatedGas * 120n) / 100n + 25_000n

const requireWalletClient = (clients: ContractClients): WalletClient => {
  if (clients.walletClient == null) {
    throw new Error('Wallet client not connected.')
  }
  return clients.walletClient
}

export const getWalletAccount = async (
  walletClient: WalletClient
): Promise<Account | Address> => {
  if (walletClient.account != null) return walletClient.account
  const [address] = await walletClient.getAddresses()
  if (address == null) {
    throw new Error('Wallet client account not available.')
  }
  return address
}

export const getWalletAddress = async (
  walletClient: WalletClient
): Promise<Address> => {
  const account = await getWalletAccount(walletClient)
  return typeof account === 'string' ? account : account.address
}

const getTransactionChain = (walletClient: WalletClient) =>
  (walletClient.chain ?? null) as never

const createTransaction = (
  publicClient: PublicClient,
  hash: Hex
): OrganigramTransaction => ({
  hash,
  wait: async () => {
    const [receipt, transaction] = await Promise.all([
      publicClient.waitForTransactionReceipt({ hash }),
      publicClient.getTransaction({ hash }).catch(() => null)
    ])
    return {
      ...receipt,
      gasPrice: transaction?.gasPrice ?? receipt.effectiveGasPrice ?? null
    }
  }
})

export const getContractInstance = <TAbi extends Abi | readonly unknown[]>({
  address,
  abi,
  publicClient,
  walletClient
}: {
  address: string
  abi: TAbi
} & ContractClients) =>
  getContract({
    address: getAddress(address as Address),
    abi: abi as Abi,
    client:
      walletClient != null
        ? { public: publicClient, wallet: walletClient }
        : publicClient
  })

export const createContractWriteTransaction = async <
  TAbi extends Abi | readonly unknown[]
>({
  address,
  abi,
  functionName,
  args,
  clients,
  nonce,
  value
}: {
  address: string
  abi: TAbi
  functionName: string
  args?: unknown[]
  clients: ContractClients
  nonce?: number
  value?: bigint
}): Promise<OrganigramTransaction> => {
  const walletClient = requireWalletClient(clients)
  const account = await getWalletAccount(walletClient)
  const hash = await (walletClient.writeContract as any)({
    address: getAddress(address as Address),
    abi: abi as Abi,
    functionName: functionName as never,
    args: (args ?? []) as never,
    account,
    chain: getTransactionChain(walletClient),
    ...(nonce != null ? { nonce } : {}),
    ...(value != null ? { value } : {})
  })
  return createTransaction(clients.publicClient, hash)
}

export const createDeployTransaction = async <
  TAbi extends Abi | readonly unknown[]
>({
  abi,
  bytecode,
  args,
  clients,
  nonce,
  value
}: {
  abi: TAbi
  bytecode: string
  args?: unknown[]
  clients: ContractClients
  nonce?: number
  value?: bigint
}): Promise<OrganigramTransaction> => {
  const walletClient = requireWalletClient(clients)
  const account = await getWalletAccount(walletClient)
  const hash = await (walletClient.deployContract as any)({
    abi: abi as Abi,
    bytecode: bytecode as Hex,
    args: (args ?? []) as never,
    account,
    chain: getTransactionChain(walletClient),
    ...(nonce != null ? { nonce } : {}),
    ...(value != null ? { value } : {})
  })
  return createTransaction(clients.publicClient, hash)
}
