import { type Hex } from 'viem'
import { type ContractClients, getContractInstance } from './contracts'

export const MULTICALL3_ADDRESS =
  '0xcA11bde05977b3631167028862bE2a173976CA11'

const multicall3Abi = [
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'aggregate3',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'callData', type: 'bytes' }
        ]
      }
    ],
    outputs: [
      {
        name: 'returnData',
        type: 'tuple[]',
        components: [
          { name: 'success', type: 'bool' },
          { name: 'returnData', type: 'bytes' }
        ]
      }
    ]
  }
] as const

export type MulticallRequest<T> = {
  target: string
  allowFailure?: boolean
  callData: string
  decode: (returnData: Hex) => T
}

export const tryMulticall = async <T>(
  clients: ContractClients,
  requests: MulticallRequest<T>[]
): Promise<Array<T | null> | null> => {
  if (requests.length === 0) return []

  const contract = getContractInstance({
    address: MULTICALL3_ADDRESS,
    abi: multicall3Abi,
    publicClient: clients.publicClient
  })

  try {
    const responses = (await contract.read.aggregate3([
      requests.map(request => ({
        target: request.target,
        allowFailure: request.allowFailure ?? true,
        callData: request.callData as Hex
      }))
    ])) as Array<{ success: boolean; returnData: Hex }>

    return responses.map((response: any, index: number) => {
      if (!response.success) return null
      try {
        return requests[index].decode(response.returnData)
      } catch (_error) {
        return null
      }
    })
  } catch (_error) {
    return null
  }
}
