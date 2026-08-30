import deployedAddresses, { getDeployment } from '../src/deployments'

describe('protocol deployments', () => {
  it('treats an empty deployment address as missing', () => {
    const chainId = '999001'
    const previous = deployedAddresses[chainId]
    deployedAddresses[chainId] = {
      Asset: '0x0000000000000000000000000000000000000001',
      Organ: '0x0000000000000000000000000000000000000002',
      ERC20VoteProcedure: '0x0000000000000000000000000000000000000003',
      NominationProcedure: '0x0000000000000000000000000000000000000004',
      VoteProcedure: '0x0000000000000000000000000000000000000005',
      MetaGasStation: '0x0000000000000000000000000000000000000006',
      OrganigramClient: '',
      CloneableOrgan: '0x0000000000000000000000000000000000000007',
      CloneableAsset: '0x0000000000000000000000000000000000000008'
    }

    try {
      expect(() => getDeployment(chainId, 'OrganigramClient')).toThrow(
        'Missing OrganigramClient deployment for chain 999001.'
      )
    } finally {
      if (previous == null) {
        delete deployedAddresses[chainId]
      } else {
        deployedAddresses[chainId] = previous
      }
    }
  })

  it('rejects an invalid non-empty deployment address', () => {
    const chainId = '999002'
    const previous = deployedAddresses[chainId]
    deployedAddresses[chainId] = {
      Asset: '0x0000000000000000000000000000000000000001',
      Organ: '0x0000000000000000000000000000000000000002',
      ERC20VoteProcedure: '0x0000000000000000000000000000000000000003',
      NominationProcedure: '0x0000000000000000000000000000000000000004',
      VoteProcedure: '0x0000000000000000000000000000000000000005',
      MetaGasStation: '0x0000000000000000000000000000000000000006',
      OrganigramClient: 'not-an-address',
      CloneableOrgan: '0x0000000000000000000000000000000000000007',
      CloneableAsset: '0x0000000000000000000000000000000000000008'
    }

    try {
      expect(() => getDeployment(chainId, 'OrganigramClient')).toThrow(
        'Invalid OrganigramClient deployment for chain 999002: not-an-address.'
      )
    } finally {
      if (previous == null) {
        delete deployedAddresses[chainId]
      } else {
        deployedAddresses[chainId] = previous
      }
    }
  })
})
