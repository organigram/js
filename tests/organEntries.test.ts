import { zeroAddress, type PublicClient } from 'viem'

import { Organ } from '../src/organ'

const organAddress = '0x0000000000000000000000000000000000000100'
const accountAddress = '0x0000000000000000000000000000000000000200'

const createOrganData = () => ({
  cid: 'organ',
  permissionsLength: 0n,
  entriesLength: 3n,
  entriesCount: 2n
})

describe('Organ.loadEntries', () => {
  it('keeps CID-only data entries when loading without multicall', async () => {
    const readContract = jest.fn(async ({ functionName, args }) => {
      if (functionName === 'aggregate3') {
        throw new Error('Multicall unavailable')
      }
      if (functionName !== 'getEntry') {
        throw new Error(`Unexpected function ${functionName}`)
      }

      return BigInt(args[0]) === 1n
        ? { addr: zeroAddress, cid: 'data-cid' }
        : { addr: accountAddress, cid: 'account-cid' }
    })

    const entries = await Organ.loadEntries(
      organAddress,
      { publicClient: { readContract } as unknown as PublicClient },
      createOrganData()
    )

    expect(entries).toEqual([
      { index: '1', address: zeroAddress, cid: 'data-cid' },
      { index: '2', address: accountAddress, cid: 'account-cid' }
    ])
  })
})
