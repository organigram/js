import { assertValidProposalOperations } from '../src/procedure'

const target = '0x0000000000000000000000000000000000000001'

describe('assertValidProposalOperations', () => {
  it('requires a non-empty contract call', () => {
    expect(() => assertValidProposalOperations([])).toThrow(
      'at least one valid operation'
    )
    expect(() =>
      assertValidProposalOperations([
        { index: '0', target, data: '0x', functionSelector: '0x' }
      ])
    ).toThrow('must contain a contract call')
  })

  it('accepts a populated contract operation', () => {
    expect(() =>
      assertValidProposalOperations([
        {
          index: '0',
          target,
          data: '0x12345678',
          functionSelector: '0x12345678',
          value: '0'
        }
      ])
    ).not.toThrow()
  })
})
