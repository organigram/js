import { zeroAddress } from 'viem'
import {
  applyDeployedOrganigramAddresses,
  markExistingOrganigramDeployments,
  refreshUndeployedContractReferences
} from '../src/deploymentReferences'
import { predictContractAddress } from '../src/utils'
import { DeployOrganigramInput } from '../src'

describe('refreshUndeployedContractReferences', () => {
  it('refreshes stale draft addresses before batch deployment', () => {
    const chainId = '31337'
    const staleAssetAddress = '0x0000000000000000000000000000000000000a01'
    const staleOrganAddress = '0x0000000000000000000000000000000000000b01'
    const staleProcedureAddress = '0x0000000000000000000000000000000000000c01'
    const assetSalt =
      '0x00000000000000000000000000000000000000000000000000000000000000a1'
    const organSalt =
      '0x00000000000000000000000000000000000000000000000000000000000000b1'
    const procedureSalt =
      '0x00000000000000000000000000000000000000000000000000000000000000c1'
    const input = {
      organs: [
        {
          address: staleOrganAddress,
          cid: 'organ',
          salt: organSalt,
          permissions: [
            { permissionAddress: staleProcedureAddress, permissionValue: 1 }
          ],
          entries: []
        }
      ],
      assets: [
        {
          address: staleAssetAddress,
          name: 'Shares',
          symbol: 'EQT',
          salt: assetSalt
        }
      ],
      procedures: [
        {
          address: staleProcedureAddress,
          typeName: 'erc20Vote',
          chainId,
          cid: 'vote',
          proposers: staleOrganAddress,
          moderators: zeroAddress,
          deciders: staleOrganAddress,
          withModeration: false,
          forwarder: zeroAddress,
          salt: procedureSalt,
          data: JSON.stringify({
            erc20: staleAssetAddress,
            equityTransferRegister: staleOrganAddress,
            quorumSize: '20001',
            voteDuration: '3600',
            majoritySize: '50001'
          })
        }
      ]
    }

    const refreshed = refreshUndeployedContractReferences(
      input as DeployOrganigramInput,
      chainId
    )
    const expectedAssetAddress = predictContractAddress({
      type: 'Asset',
      chainId,
      salt: assetSalt
    })
    const expectedOrganAddress = predictContractAddress({
      type: 'Organ',
      chainId,
      salt: organSalt
    })
    const expectedProcedureAddress = predictContractAddress({
      type: 'ERC20VoteProcedure',
      chainId,
      salt: procedureSalt
    })

    expect((refreshed.assets[0] as { address?: string }).address).toBe(
      expectedAssetAddress
    )
    expect((refreshed.organs[0] as { address?: string }).address).toBe(
      expectedOrganAddress
    )
    expect(refreshed.organs[0].permissions?.[0].permissionAddress).toBe(
      expectedProcedureAddress
    )
    expect((refreshed.procedures[0] as { address?: string }).address).toBe(
      expectedProcedureAddress
    )
    expect(refreshed.procedures[0].deciders).toBe(expectedOrganAddress)
    expect(JSON.parse(refreshed.procedures[0].data ?? '{}').erc20).toBe(
      expectedAssetAddress
    )
    expect(
      JSON.parse(refreshed.procedures[0].data ?? '{}').equityTransferRegister
    ).toBe(expectedOrganAddress)
    expect(input.procedures[0].deciders).toBe(staleOrganAddress)
  })

  it('returns deployed event addresses without mutating the original draft input', () => {
    const staleAssetAddress = '0x0000000000000000000000000000000000000a01'
    const staleOrganAddress = '0x0000000000000000000000000000000000000b01'
    const staleProcedureAddress = '0x0000000000000000000000000000000000000c01'
    const actualAssetAddress = '0x0000000000000000000000000000000000000a02'
    const actualOrganAddress = '0x0000000000000000000000000000000000000b02'
    const actualProcedureAddress = '0x0000000000000000000000000000000000000c02'
    const deployedOrganAddress = '0x0000000000000000000000000000000000000d01'
    const input = {
      organs: [
        {
          address: staleOrganAddress,
          cid: 'organ',
          salt: '0x00000000000000000000000000000000000000000000000000000000000000b1',
          permissions: [
            { permissionAddress: staleProcedureAddress, permissionValue: 1 }
          ],
          entries: []
        },
        {
          address: deployedOrganAddress,
          cid: 'already-deployed',
          isDeployed: true,
          permissions: [],
          entries: []
        }
      ],
      assets: [
        {
          address: staleAssetAddress,
          name: 'Shares',
          symbol: 'EQT',
          salt: '0x00000000000000000000000000000000000000000000000000000000000000a1'
        }
      ],
      procedures: [
        {
          address: staleProcedureAddress,
          typeName: 'erc20Vote',
          chainId: '31337',
          cid: 'vote',
          proposers: staleOrganAddress,
          moderators: zeroAddress,
          deciders: staleOrganAddress,
          withModeration: false,
          forwarder: zeroAddress,
          salt: '0x00000000000000000000000000000000000000000000000000000000000000c1',
          data: JSON.stringify({
            erc20: staleAssetAddress,
            quorumSize: '20001',
            voteDuration: '3600',
            majoritySize: '50001'
          })
        }
      ]
    }

    Object.freeze(input.organs[0])
    Object.freeze(input.assets[0])
    Object.freeze(input.procedures[0])

    const deployedInput = applyDeployedOrganigramAddresses(
      input as DeployOrganigramInput,
      {
        organs: [actualOrganAddress],
        assets: [actualAssetAddress],
        procedures: [actualProcedureAddress]
      }
    )

    expect(
      deployedInput.organs[0] as { address?: string; isDeployed?: boolean }
    ).toMatchObject({
      address: actualOrganAddress,
      isDeployed: true
    })
    expect((deployedInput.organs[1] as { address?: string }).address).toBe(
      deployedOrganAddress
    )
    expect(deployedInput.organs[0].permissions?.[0].permissionAddress).toBe(
      actualProcedureAddress
    )
    expect(
      deployedInput.assets[0] as { address?: string; isDeployed?: boolean }
    ).toMatchObject({
      address: actualAssetAddress,
      isDeployed: true
    })
    expect(
      deployedInput.procedures[0] as { address?: string; isDeployed?: boolean }
    ).toMatchObject({
      address: actualProcedureAddress,
      isDeployed: true
    })
    expect(deployedInput.procedures[0].deciders).toBe(actualOrganAddress)
    expect(JSON.parse(deployedInput.procedures[0].data ?? '{}').erc20).toBe(
      actualAssetAddress
    )
    expect((input.organs[0] as { address?: string }).address).toBe(
      staleOrganAddress
    )
    expect((input.assets[0] as { address?: string }).address).toBe(
      staleAssetAddress
    )
    expect((input.procedures[0] as { address?: string }).address).toBe(
      staleProcedureAddress
    )
  })

  it('marks existing deterministic addresses as deployed without mutating the draft input', async () => {
    const existingOrganAddress = '0x0000000000000000000000000000000000000b02'
    const missingAssetAddress = '0x0000000000000000000000000000000000000a02'
    const missingProcedureAddress = '0x0000000000000000000000000000000000000c02'
    const input = {
      organs: [
        {
          address: existingOrganAddress,
          cid: 'organ',
          salt: '0x00000000000000000000000000000000000000000000000000000000000000b1',
          permissions: [],
          entries: []
        }
      ],
      assets: [
        {
          address: missingAssetAddress,
          name: 'Shares',
          symbol: 'EQT',
          salt: '0x00000000000000000000000000000000000000000000000000000000000000a1'
        }
      ],
      procedures: [
        {
          address: missingProcedureAddress,
          typeName: 'erc20Vote',
          chainId: '31337',
          cid: 'vote',
          proposers: existingOrganAddress,
          moderators: zeroAddress,
          deciders: existingOrganAddress,
          withModeration: false,
          forwarder: zeroAddress,
          salt: '0x00000000000000000000000000000000000000000000000000000000000000c1',
          data: JSON.stringify({
            erc20: missingAssetAddress,
            quorumSize: '20001',
            voteDuration: '3600',
            majoritySize: '50001'
          })
        }
      ]
    }
    Object.freeze(input.organs[0])

    const marked = await markExistingOrganigramDeployments(
      input as DeployOrganigramInput,
      {
        getCode: async ({ address }: { address: string }) =>
          address === existingOrganAddress ? '0x1234' : '0x'
      } as never
    )

    expect(marked.organs[0]).toMatchObject({
      address: existingOrganAddress,
      isDeployed: true
    })
    expect((input.organs[0] as { isDeployed?: boolean }).isDeployed).toBe(
      undefined
    )
    expect((marked.assets[0] as { isDeployed?: boolean }).isDeployed).toBe(
      undefined
    )
    expect((marked.procedures[0] as { isDeployed?: boolean }).isDeployed).toBe(
      undefined
    )
  })
})
