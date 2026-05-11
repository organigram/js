import { renewSaltsAndAddresses } from '../src/template'

describe('renewSaltsAndAddresses', () => {
  it('renews duplicate placeholder salts and addresses independently', () => {
    const renewed = renewSaltsAndAddresses(
      {
        name: 'Imported organigram',
        organs: [
          {
            salt: 'committee-salt',
            address: 'committee-address',
            name: 'Committee A',
            permissions: [
              {
                permissionAddress: 'vote-address',
                permissionValue: 1
              }
            ]
          },
          {
            salt: 'committee-salt',
            address: 'committee-address',
            name: 'Committee B',
            permissions: []
          }
        ],
        procedures: [
          {
            salt: 'vote-salt',
            address: 'vote-address',
            name: 'Vote A',
            description: '',
            typeName: 'vote',
            deciders: 'committee-address',
            proposers: 'committee-salt',
            moderators: 'committee-salt',
            withModeration: false,
            data: '{}'
          },
          {
            salt: 'vote-salt',
            address: 'vote-address',
            name: 'Vote B',
            description: '',
            typeName: 'vote',
            deciders: 'committee-address',
            proposers: 'committee-salt',
            moderators: 'committee-salt',
            withModeration: false,
            data: '{}'
          }
        ],
        assets: []
      },
      '11155111'
    )

    expect(new Set(renewed.organs?.map(organ => organ.salt)).size).toBe(2)
    expect(new Set(renewed.organs?.map(organ => organ.address)).size).toBe(2)
    expect(
      new Set(renewed.procedures?.map(procedure => procedure.salt)).size
    ).toBe(2)
    expect(
      new Set(renewed.procedures?.map(procedure => procedure.address)).size
    ).toBe(2)
    expect(renewed.procedures?.[0].deciders).toBe(renewed.organs?.[0].address)
    expect(renewed.organs?.[0].permissions?.[0].permissionAddress).toBe(
      renewed.procedures?.[0].address
    )
  })
})
