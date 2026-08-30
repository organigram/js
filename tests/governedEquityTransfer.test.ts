import { encodeFunctionData, parseAbi } from 'viem'
import { ERC20VoteProcedure } from '../src/procedure/erc20Vote'
import { getTemplate, isTemplateSupportedOnChain } from '../src/template'
import {
  getProcedureTypes,
  prepareDeployProceduresInput
} from '../src/procedure/utils'
import deployedAddresses from '../src/deployments'
import { PERMISSIONS } from '../src/utils'
import { DeployProceduresInput } from '../src'

test('prepares every commercial equity template from ordinary procedure types', () => {
  const chainId = '99931337'
  deployedAddresses[chainId] = {
    OrganigramClient: '0x0000000000000000000000000000000000000001',
    CloneableOrgan: '0x0000000000000000000000000000000000000002',
    CloneableAsset: '0x0000000000000000000000000000000000000003',
    EquityToken: '0x0000000000000000000000000000000000000004',
    ERC20VoteProcedure: '0x0000000000000000000000000000000000000005',
    VoteProcedure: '0x0000000000000000000000000000000000000006',
    NominationProcedure: '0x0000000000000000000000000000000000000007',
    MetaGasStation: '0x0000000000000000000000000000000000000009'
  }

  try {
    for (const templateName of ['sas', 'sasu', 'sa', 'sarl'] as const) {
      const template = getTemplate(templateName, chainId)
      const shares = template.assets.find(asset => asset.kind === 'equity')!
      const decision = template.procedures.find(
        procedure => procedure.address === shares.decisionProcedure
      )!
      const equityTransferRegister = JSON.parse(
        decision.data ?? '{}'
      ).equityTransferRegister
      const register = template.organs.find(
        organ => organ.address === equityTransferRegister
      )!

      expect(shares.decisionProcedure).toBe(decision.address)
      expect(register.permissions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ permissionAddress: decision.address })
        ])
      )
      expect(decision.typeName).not.toBe('shareTransfer' as never)
    }
  } finally {
    delete deployedAddresses[chainId]
  }
})

test('uses the ordinary equity implementation for commercial templates', () => {
  expect(isTemplateSupportedOnChain('sas', '1')).toBe(false)
  expect(isTemplateSupportedOnChain('sas', '31337')).toBe(true)
})

test('gives every commercial-template organ a permission list for persistence', () => {
  for (const templateName of ['sas', 'sasu', 'sa', 'sarl'] as const) {
    const template = getTemplate(templateName, '31337')
    for (const organ of template.organs ?? []) {
      expect(Array.isArray(organ.permissions)).toBe(true)
    }
  }
})

test('provides every commercial template with the common statutory record foundation', () => {
  const commonRegisters = ['Bylaws']

  for (const templateName of ['sas', 'sasu', 'sa', 'sarl'] as const) {
    const template = getTemplate(templateName, '31337')
    const organNames = new Set(template.organs?.map(organ => organ.name))

    for (const registerName of commonRegisters) {
      expect(organNames).toContain(registerName)
    }
    expect(organNames).not.toContain('Accounting records')
  }
})

test('keeps annual accounts with the commercial decision procedure only', () => {
  const annualAccountsProcedureNames = {
    sas: 'Adopt a resolution',
    sasu: 'Amend bylaws',
    sa: 'Amend bylaws',
    sarl: 'Record shareholder decision'
  } as const
  const removedOrganNames = [
    'General journal',
    'General ledger',
    'Annual inventory',
    'Accounting supporting documents',
    'Corporate filings'
  ]
  const removedProcedureNames = [
    'Maintain accounting records',
    'Approve annual accounts',
    'Maintain corporate filings'
  ]

  for (const templateName of ['sas', 'sasu', 'sa', 'sarl'] as const) {
    const template = getTemplate(templateName, '31337')
    const organNames = new Set(template.organs?.map(organ => organ.name))
    const procedureNames = new Set(
      template.procedures?.map(procedure => procedure.name)
    )
    const financialStatements = template.organs?.find(
      organ => organ.name === 'Financial statements'
    )
    const annualAccountsProcedure = template.procedures?.find(
      procedure => procedure.name === annualAccountsProcedureNames[templateName]
    )

    for (const procedureName of removedProcedureNames) {
      expect(procedureNames).not.toContain(procedureName)
    }
    for (const organName of removedOrganNames) {
      expect(organNames).not.toContain(organName)
    }
    expect(financialStatements?.permissions).toEqual(
      expect.arrayContaining([
        {
          permissionAddress: annualAccountsProcedure?.address,
          permissionValue: PERMISSIONS.ADD_ENTRIES
        }
      ])
    )
  }
})

test('lets management approve payments from the payments organ', () => {
  const paymentPermissions =
    PERMISSIONS.ADD_ENTRIES |
    PERMISSIONS.WITHDRAW_ETHER |
    PERMISSIONS.WITHDRAW_COINS |
    PERMISSIONS.WITHDRAW_COLLECTIBLES

  const managementNames = {
    sas: 'Chairman',
    sasu: 'President',
    sa: 'Board of directors',
    sarl: 'Managers'
  } as const

  for (const templateName of ['sas', 'sasu', 'sa', 'sarl'] as const) {
    const template = getTemplate(templateName, '31337')
    const compensationProcedure = template.procedures.find(
      procedure => procedure.name === 'Make a payment'
    )
    const payments = template.organs.find(organ => organ.name === 'Payments')
    const management = template.organs.find(
      organ => organ.name === managementNames[templateName]
    )
    const procedureData = JSON.parse(compensationProcedure?.data ?? '{}')

    expect(compensationProcedure?.name).toBe('Make a payment')
    expect(compensationProcedure?.typeName).toBe('nomination')
    expect(compensationProcedure?.deciders).toBe(management?.address)
    expect(compensationProcedure?.proposers).toBe(management?.address)
    expect(procedureData).not.toHaveProperty('erc20')
    expect(payments?.permissions).toEqual(
      expect.arrayContaining([
        {
          permissionAddress: compensationProcedure?.address,
          permissionValue: paymentPermissions
        }
      ])
    )
  }
})

test('renames the SAS shareholders-meeting procedure to adopt a resolution', () => {
  const template = getTemplate('sas', '31337')
  const procedureNames = new Set(
    template.procedures?.map(procedure => procedure.name)
  )

  expect(procedureNames).toContain('Adopt a resolution')
  expect(procedureNames).not.toContain('Shareholders meeting')
})

test('does not include executive management in the SAS template', () => {
  const template = getTemplate('sas', '31337')
  const organNames = new Set(template.organs?.map(organ => organ.name))
  const procedureNames = new Set(
    template.procedures?.map(procedure => procedure.name)
  )

  expect(organNames).not.toContain('Executive management')
  expect(procedureNames).not.toContain('Appoint executive management')
})

test('models the decision records and governing bodies specific to each commercial form', () => {
  const expectedByTemplate = {
    sasu: {
      organs: [
        'Procès-verbaux d’assemblée générale',
        'Résolutions de l’assemblée générale'
      ],
      procedures: ['Amend bylaws']
    },
    sa: {
      organs: [
        'Board of directors',
        'Executive management',
        'Procès-verbaux d’assemblée générale',
        'Résolutions de l’assemblée générale'
      ],
      procedures: ['Appoint executive management', 'Amend bylaws']
    },
    sarl: {
      organs: [
        'Procès-verbaux d’assemblée générale',
        'Résolutions de l’assemblée générale'
      ],
      procedures: ['Appoint managers', 'Amend bylaws']
    }
  } as const

  for (const [templateName, expected] of Object.entries(expectedByTemplate)) {
    const template = getTemplate(templateName as 'sasu', '31337')
    const organNames = new Set(template.organs?.map(organ => organ.name))
    const procedureNames = new Set(
      template.procedures?.map(procedure => procedure.name)
    )

    for (const organName of expected.organs) {
      expect(organNames).toContain(organName)
    }
    for (const procedureName of expected.procedures) {
      expect(procedureNames).toContain(procedureName)
    }
  }
})

test('prepares SAS procedures for deployment without a special transfer procedure', async () => {
  const template = getTemplate('sas', '31337')
  await expect(
    prepareDeployProceduresInput(
      template.procedures as DeployProceduresInput[],
      {
        walletClient: {},
        publicClient: { getChainId: async () => 31337 }
      } as any
    )
  ).resolves.toHaveLength(template.procedures!.length)
})

test('encodes the organ-member double-majority option for ERC20 votes', async () => {
  const prepared = await ERC20VoteProcedure._populateInitialize(
    {
      cid: 'sarl-transfer',
      proposers: '0x0000000000000000000000000000000000000100',
      moderators: '0x0000000000000000000000000000000000000000',
      deciders: '0x0000000000000000000000000000000000000200',
      withModeration: false,
      forwarder: '0x0000000000000000000000000000000000000300',
      args: [
        '0x0000000000000000000000000000000000000400',
        '50001',
        '3600',
        '50001'
      ],
      proposerMode: 'token',
      moderatorMode: 'disabled',
      voterMode: 'organ',
      requireMemberMajority: true
    },
    {} as any
  )

  expect(prepared.data).toBe(
    encodeFunctionData({
      abi: parseAbi([
        'function initialize(string,address,address,address,bool,address,uint32,uint32,uint32,address,uint8[3],bool)'
      ]),
      functionName: 'initialize',
      args: [
        'sarl-transfer',
        '0x0000000000000000000000000000000000000100',
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000200',
        false,
        '0x0000000000000000000000000000000000000300',
        50001,
        3600,
        50001,
        '0x0000000000000000000000000000000000000400',
        [1, 2, 0],
        true
      ]
    })
  )
})

test('does not expose a special transfer procedure type', () => {
  expect(getProcedureTypes('31337')).not.toHaveProperty('shareTransfer')
})
