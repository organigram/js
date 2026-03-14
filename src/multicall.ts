import { ethers } from 'ethers'

export const MULTICALL3_ADDRESS =
  '0xcA11bde05977b3631167028862bE2a173976CA11'

const multicall3Abi = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)'
]

const multicall3Contract = new ethers.Interface(multicall3Abi)

export type MulticallRequest<T> = {
  target: string
  allowFailure?: boolean
  callData: string
  decode: (returnData: string) => T
}

export const getProviderFromSignerOrProvider = (
  signerOrProvider?: ethers.Signer | ethers.Provider | null
): ethers.Provider | null => {
  if (signerOrProvider == null) return null
  return (
    (signerOrProvider as ethers.Signer).provider ??
    (signerOrProvider as ethers.Provider)
  )
}

export const tryMulticall = async <T>(
  signerOrProvider: ethers.Signer | ethers.Provider,
  requests: MulticallRequest<T>[]
): Promise<Array<T | null> | null> => {
  if (requests.length === 0) return []

  const provider = getProviderFromSignerOrProvider(signerOrProvider)
  if (provider == null) return null

  const contract = new ethers.Contract(
    MULTICALL3_ADDRESS,
    multicall3Contract,
    provider
  )

  try {
    const responses = await contract.aggregate3(
      requests.map(request => ({
        target: request.target,
        allowFailure: request.allowFailure ?? true,
        callData: request.callData
      }))
    )

    return responses.map(
      (
        response: {
          success: boolean
          returnData: string
        },
        index: number
      ) => {
        if (!response.success) return null
        try {
          return requests[index].decode(response.returnData)
        } catch (_error) {
          return null
        }
      }
    )
  } catch (_error) {
    return null
  }
}
