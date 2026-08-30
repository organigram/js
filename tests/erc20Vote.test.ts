import { parseAbi, encodeFunctionData, zeroAddress } from 'viem'
import { ERC20VoteProcedure } from '../src/procedure/erc20Vote'
import { prepareDeployProceduresInput } from '../src/procedure/utils'

describe('ERC20VoteProcedure', () => {
  it('treats empty nomination source addresses as unset during deployment preparation', async () => {
    const deciders = '0x0000000000000000000000000000000000000200'
    const forwarder = '0x0000000000000000000000000000000000000300'

    const [prepared] = await prepareDeployProceduresInput(
      [
        {
          typeName: 'nomination',
          chainId: '11155111',
          cid: 'nomination',
          proposers: '',
          moderators: '',
          deciders,
          withModeration: false,
          forwarder,
          salt:
            '0x0000000000000000000000000000000000000000000000000000000000000001'
        }
      ],
      { walletClient: {}, publicClient: {} } as any
    )

    const expected = encodeFunctionData({
      abi: parseAbi([
        'function initialize(string,address,address,address,bool,address)'
      ]),
      functionName: 'initialize',
      args: [
        'nomination',
        deciders,
        '0x0000000000000000000000000000000000000000',
        deciders,
        false,
        forwarder
      ]
    })

    expect(prepared.data).toBe(expected)
  })

  it('allows token holders to be the deciders without an organ address', async () => {
    const token = '0x0000000000000000000000000000000000000100'
    const forwarder = '0x0000000000000000000000000000000000000300'

    const [prepared] = await prepareDeployProceduresInput(
      [
        {
          typeName: 'erc20Vote',
          chainId: '11155111',
          cid: 'erc20-vote',
          proposers: '',
          moderators: '',
          deciders: '',
          withModeration: false,
          forwarder,
          salt:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          data: JSON.stringify({
            erc20: token,
            quorumSize: '0',
            voteDuration: '10',
            majoritySize: '50000',
            proposerMode: 'token',
            moderatorMode: 'disabled',
            voterMode: 'token'
          })
        }
      ],
      { walletClient: {}, publicClient: {} } as any
    )

    expect(prepared.data).toBe(
      encodeFunctionData({
        abi: parseAbi([
          'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address,uint8[3])'
        ]),
        functionName: 'initialize',
        args: [
          'erc20-vote',
          zeroAddress,
          zeroAddress,
          zeroAddress,
          false,
          forwarder,
          0,
          10,
          50000,
          token,
          [1, 2, 1]
        ]
      })
    )
  })

  it('encodes legacy organ role initialization when role modes are not configured', async () => {
    const token = '0x0000000000000000000000000000000000000100'
    const sourceOrgan = '0x0000000000000000000000000000000000000200'
    const forwarder = '0x0000000000000000000000000000000000000300'

    const [prepared] = await prepareDeployProceduresInput(
      [
        {
          typeName: 'erc20Vote',
          chainId: '11155111',
          cid: 'erc20-vote',
          proposers: sourceOrgan,
          moderators: sourceOrgan,
          deciders: sourceOrgan,
          withModeration: true,
          forwarder,
          salt:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          data: JSON.stringify({
            erc20: token,
            quorumSize: '0',
            voteDuration: '10',
            majoritySize: '50000',
          })
        }
      ],
      { walletClient: {}, publicClient: {} } as any
    )

    const expected = encodeFunctionData({
      abi: parseAbi([
        'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address)'
      ]),
      functionName: 'initialize',
      args: [
        'erc20-vote',
        sourceOrgan,
        sourceOrgan,
        sourceOrgan,
        true,
        forwarder,
        0,
        10,
        50000,
        token
      ]
    })

    expect(prepared.data).toBe(expected)
  })

  it('encodes ERC20 vote data by field name instead of JSON property order', async () => {
    const token = '0x0000000000000000000000000000000000000100'
    const sourceOrgan = '0x0000000000000000000000000000000000000200'
    const forwarder = '0x0000000000000000000000000000000000000300'

    const [prepared] = await prepareDeployProceduresInput(
      [
        {
          typeName: 'erc20Vote',
          chainId: '11155111',
          cid: 'erc20-vote',
          proposers: sourceOrgan,
          moderators: sourceOrgan,
          deciders: sourceOrgan,
          withModeration: true,
          forwarder,
          salt:
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          data: JSON.stringify({
            quorumSize: '0',
            voteDuration: '10',
            majoritySize: '50000',
            erc20: token
          })
        }
      ],
      { walletClient: {}, publicClient: {} } as any
    )

    const expected = encodeFunctionData({
      abi: parseAbi([
        'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address)'
      ]),
      functionName: 'initialize',
      args: [
        'erc20-vote',
        sourceOrgan,
        sourceOrgan,
        sourceOrgan,
        true,
        forwarder,
        0,
        10,
        50000,
        token
      ]
    })

    expect(prepared.data).toBe(expected)
  })

  it('encodes independent role modes when configured', async () => {
    const token = '0x0000000000000000000000000000000000000100'
    const sourceOrgan = '0x0000000000000000000000000000000000000200'
    const forwarder = '0x0000000000000000000000000000000000000300'

    const populated = await ERC20VoteProcedure._populateInitialize(
      {
        cid: 'erc20-vote',
        proposers: sourceOrgan,
        moderators: sourceOrgan,
        deciders: sourceOrgan,
        withModeration: true,
        forwarder,
        args: [token, '0', '10', '50000'],
        proposerMode: 'token',
        moderatorMode: 'organ',
        voterMode: 'token'
      } as any,
      {} as any
    )

    const expected = encodeFunctionData({
      abi: parseAbi([
        'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address,uint8[3])'
      ]),
      functionName: 'initialize',
      args: [
        'erc20-vote',
        sourceOrgan,
        sourceOrgan,
        sourceOrgan,
        true,
        forwarder,
        0,
        10,
        50000,
        token,
        [1, 0, 1]
      ]
    })

    expect(populated.data).toBe(expected)
  })
})
