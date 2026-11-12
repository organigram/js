import type {
  Abi,
  Account,
  Address,
  GetContractReturnType,
  Hex,
  PublicClient,
  TransactionReceipt,
  WalletClient
} from 'viem'
import { getAddress, getContract } from 'viem'

/** The viem clients the SDK reads and writes with. */
export type ContractClients = {
  /** Client used for every read. */
  publicClient: PublicClient
  /** Client that signs transactions. Without it, the SDK is read-only. */
  walletClient?: WalletClient | null
}

/** The receipt of a mined transaction. */
export type OrganigramTransactionReceipt = TransactionReceipt & {
  gasPrice?: bigint | null
}

/** A sent transaction, with a `wait()` that resolves once it is mined. */
export type OrganigramTransaction = {
  /** Transaction hash. */
  hash: Hex
  /** Wait for the transaction to be mined, and throw if it reverted. */
  wait: () => Promise<OrganigramTransactionReceipt>
}

/** Add a 20% margin plus 25,000 gas to a gas estimate. */
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

/** Return the address of the account a wallet client signs with. */
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
    // A mined transaction can still have reverted: never report it as done.
    if (receipt.status !== 'success') {
      throw new Error(`Transaction ${hash} reverted.`)
    }
    return {
      ...receipt,
      gasPrice: transaction?.gasPrice ?? receipt.effectiveGasPrice ?? null
    }
  }
})

/** A viem contract instance bound to the SDK clients. */
export type OrganigramContract = GetContractReturnType<
  Abi,
  PublicClient | { public: PublicClient; wallet: WalletClient }
>

export const getContractInstance = <TAbi extends Abi | readonly unknown[]>({
  address,
  abi,
  publicClient,
  walletClient
}: {
  address: string
  abi: TAbi
} & ContractClients): OrganigramContract =>
  getContract({
    address: getAddress(address as Address),
    abi: abi as Abi,
    client:
      walletClient != null
        ? { public: publicClient, wallet: walletClient }
        : publicClient
  })

/**
 * Send a contract call with a buffered gas estimate, and return it as an `OrganigramTransaction`.
 */
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
  const request = {
    address: getAddress(address as Address),
    abi: abi as Abi,
    functionName: functionName as never,
    args: (args ?? []) as never,
    account,
    ...(value != null ? { value } : {})
  }
  const gas = bufferEstimatedGas(
    await clients.publicClient.estimateContractGas(request as any)
  )
  const hash = await (walletClient.writeContract as any)({
    ...request,
    gas,
    chain: getTransactionChain(walletClient),
    ...(nonce != null ? { nonce } : {})
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
