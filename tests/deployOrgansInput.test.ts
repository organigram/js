import { zeroAddress } from 'viem'
import { prepareDeployOrgansInput } from '../src/procedure/utils'

describe('prepareDeployOrgansInput', () => {
  it('omits blank organ entries and permissions before ABI encoding', () => {
    const entryAddress = '0x0000000000000000000000000000000000000100'
    const permissionAddress = '0x0000000000000000000000000000000000000200'
    const salt =
      '0x0000000000000000000000000000000000000000000000000000000000000001'

    const [prepared] = prepareDeployOrgansInput([
      {
        cid: 'organ',
        salt,
        entries: [
          { index: '1', address: '', cid: '' },
          { index: '2', address: '   ', cid: 'draft' },
          { index: '3', address: entryAddress, cid: 'entry' }
        ],
        permissions: [
          { permissionAddress: '', permissionValue: 1 },
          { permissionAddress: '   ', permissionValue: 1 },
          { permissionAddress, permissionValue: 65535 }
        ]
      }
    ])

    expect(prepared.entries).toEqual([
      { addr: zeroAddress, cid: 'draft' },
      { addr: entryAddress, cid: 'entry' }
    ])
    expect(prepared.permissionAddresses).toEqual([permissionAddress])
    expect(prepared.permissionValues).toEqual(['0xffff'])
  })
})
