import type { OrganEntry } from '../organ'
import {
  DeployOrganInput,
  DeployProceduresInput,
  TransactionOptions
} from '../organigramClient'
import { createRandom32BytesHexId, formatSalt } from '../utils'
import {
  getDefaultChainId,
  getDeployment,
  resolveDeployment
} from '../deployments'
import type { ContractClients } from '../contracts'
import type { ProcedureType } from './index'
import { encodeFunctionData, isAddress, padHex, toHex, zeroAddress } from 'viem'

export type ProcedureTypeName =
  | 'erc20Vote'
  | 'nomination'
  | 'vote'
export type ERC20VoteRoleMode = 'organ' | 'token' | 'disabled'
export enum ProcedureTypeNameEnum {
  erc20Vote = 'erc20Vote',
  nomination = 'nomination',
  vote = 'vote'
}

export interface PopulateInitializeInput {
  options?: TransactionOptions
  typeName?: ProcedureTypeName
  cid: string
  proposers: string
  moderators: string
  deciders: string
  withModeration: boolean
  proposerMode?: ERC20VoteRoleMode
  moderatorMode?: ERC20VoteRoleMode
  voterMode?: ERC20VoteRoleMode
  requireMemberMajority?: boolean
  forwarder: string
  args: unknown[]
}

export type PopulatedTransactionData = {
  data: string
}

const normalizeOptionalAddress = (
  value: string | null | undefined
): string | undefined => {
  const normalized = value?.trim()
  return normalized == null || normalized === '' ? undefined : normalized
}

const normalizeOptionalString = (
  value: string | null | undefined
): string | undefined => {
  const normalized = value?.trim()
  return normalized == null || normalized === '' ? undefined : normalized
}

const getProcedureInitializationArgs = (
  procedure: DeployProceduresInput,
  parsedData: Record<string, unknown>
): unknown[] => {
  if (procedure.args != null) return procedure.args

  switch (procedure.typeName) {
    case 'erc20Vote':
      return [
        parsedData.erc20,
        parsedData.quorumSize,
        parsedData.voteDuration,
        parsedData.majoritySize
      ]
    case 'vote':
      return [
        parsedData.quorumSize,
        parsedData.voteDuration,
        parsedData.majoritySize
      ]
    default:
      return Object.values(parsedData)
  }
}

const encodeDynamicFunctionData = encodeFunctionData as (parameters: {
  abi: unknown
  functionName: string
  args?: unknown[]
}) => string

export const electionFields = {
  quorumSize: {
    name: 'quorumSize',
    label: 'Quorum size',
    description:
      'Size of the quorum required to start a vote. Accepts a percentage of the total of voters, with three decimals precision. Default: 20.001%',
    defaultValue: '20001',
    type: 'number'
  },
  voteDuration: {
    name: 'voteDuration',
    label: 'Vote duration',
    description:
      'Duration of the vote phase, as a number of seconds. Default: 300 seconds (5 minutes)',
    defaultValue: '300',
    type: 'number'
  },
  majoritySize: {
    name: 'majoritySize',
    label: 'Majority size',
    description:
      'Size of the majority required to pass a proposal. Accepts a percentage of the total of voters, with three decimals precision. Default: 50.001%',
    defaultValue: '50001',
    type: 'number'
  }
}

export const procedureMetadata = {
  _type: 'procedureType',
  _generator: 'https://organigram.ai',
  _generatedAt: 0
}

export const procedureTypeMetadata = {
  erc20Vote: {
    key: 'erc20Vote',
    fields: {
      ...electionFields,
      erc20: {
        name: 'erc20',
        label: 'ERC20Votes Token',
        description:
          'Address of the ERC20Votes-compatible token used for weighting the voting power.',
        defaultValue: '',
        type: 'string'
      },
      proposerMode: {
        name: 'proposerMode',
        label: 'Proposal creation rights',
        description:
          'Choose whether proposal creation is authorized by the source organ or by token holders.',
        defaultValue: 'organ',
        type: 'roleMode'
      },
      moderatorMode: {
        name: 'moderatorMode',
        label: 'Moderation rights',
        description:
          'Choose whether moderation is disabled, authorized by the source organ, or authorized by token holders.',
        defaultValue: 'organ',
        type: 'moderatorRoleMode'
      },
      voterMode: {
        name: 'voterMode',
        label: 'Voting rights',
        description:
          'Choose whether voting is authorized by the source organ or by token holders.',
        defaultValue: 'organ',
        type: 'roleMode'
      },
      requireMemberMajority: {
        name: 'requireMemberMajority',
        label: 'Member majority required',
        description:
          'When voters are members of an organ, require more than half of those members to approve in addition to the token-weighted vote.',
        defaultValue: 'false',
        type: 'boolean'
      }
    },
    metadata: {
      ...procedureMetadata,
      label: 'Token-weighted Vote',
      description:
        'A token vote allows any member in the source organ to vote on proposals, where their voting power is based on their delegated token votes at the proposal snapshot.',
      type: 'erc20Vote'
    }
  },
  nomination: {
    key: 'nomination',
    fields: {},
    metadata: {
      label: 'Nomination',
      description:
        'A nomination allows any member in the source organ to directly edit entries, assets or permissions in the target organ.'
    }
  },
  vote: {
    key: 'vote',
    fields: electionFields,
    metadata: {
      label: 'Simple Majority Vote',
      description:
        'A vote allows any user in the source organ to vote on proposals to add, edit or replace one or many entries, assets or permissions in the target organ.'
    }
  }
} as const

const procedureTypeDeploymentNames = {
  erc20Vote: 'ERC20VoteProcedure',
  nomination: 'NominationProcedure',
  vote: 'VoteProcedure'
} as const

const buildProcedureType = (
  chainId: string,
  typeName: ProcedureTypeName
): ProcedureType | undefined => {
  const address = resolveDeployment(
    chainId,
    procedureTypeDeploymentNames[typeName]
  )
  return address == null
    ? undefined
    : { ...procedureTypeMetadata[typeName], address }
}

export const getProcedureTypes = (chainId = getDefaultChainId()) =>
  Object.fromEntries(
    (Object.keys(procedureTypeDeploymentNames) as ProcedureTypeName[]).flatMap(
      typeName => {
        const type = buildProcedureType(chainId, typeName)
        return type == null ? [] : [[typeName, type]]
      }
    )
  ) as Partial<Record<ProcedureTypeName, ProcedureType>>

export const getProcedureType = (
  chainId: string,
  typeName: ProcedureTypeName
): ProcedureType => ({
  ...procedureTypeMetadata[typeName],
  address: getDeployment(chainId, procedureTypeDeploymentNames[typeName])
})

export const procedureTypes = getProcedureTypes()

export const prepareDeployOrgansInput = (
  deployOrgansInput: DeployOrganInput[]
) =>
  deployOrgansInput.map(organ => {
    const permissionAddresses: string[] = []
    const permissionValues: string[] = []
    organ.permissions?.forEach(permission => {
      const permissionAddress = normalizeOptionalAddress(
        permission.permissionAddress
      )
      if (permissionAddress == null) return

      permissionAddresses.push(permissionAddress)
      permissionValues.push(
        padHex(toHex(permission.permissionValue), { size: 2 })
      )
    })
    const entries =
      organ.entries
        ?.map((entry: OrganEntry) => {
          const address = normalizeOptionalAddress(entry.address)
          const cid = normalizeOptionalString(entry.cid)

          if (address == null && cid == null) return null

          return {
            addr: address ?? zeroAddress,
            cid: cid ?? ''
          }
        })
        .filter(
          (entry): entry is { addr: string; cid: string } => entry != null
        ) ?? []
    return {
      permissionAddresses,
      permissionValues,
      cid: organ.cid ?? '',
      entries,
      salt: organ.salt ?? createRandom32BytesHexId()
    }
  })

export const prepareDeployProceduresInput = async (
  deployProceduresInput: DeployProceduresInput[],
  clients: ContractClients
) =>
  await Promise.all(
    deployProceduresInput.map(async procedure => {
      if (
        procedure.typeName !== 'nomination' &&
        procedure.data == null &&
        procedure.args == null
      ) {
        throw new Error(
          'At least one of "data" or "args" fields must be present in ' +
            procedure.typeName +
            ' procedure input.'
        )
      }
      const parsedData = procedure.data ? JSON.parse(procedure.data) : {}
      const rawArgs = getProcedureInitializationArgs(procedure, parsedData)
      const voterMode = procedure.voterMode ?? parsedData.voterMode
      const requireMemberMajority =
        procedure.requireMemberMajority ?? parsedData.requireMemberMajority ?? false
      const deciders =
        normalizeOptionalAddress(procedure.deciders) ??
        (procedure.typeName === 'erc20Vote' && voterMode === 'token'
          ? zeroAddress
          : undefined)
      if (deciders == null) {
        throw new Error('Procedure deciders address is required.')
      }
      const proposers =
        normalizeOptionalAddress(procedure.proposers) ?? deciders
      const moderators =
        normalizeOptionalAddress(procedure.moderators) ?? zeroAddress
      const forwarder =
        normalizeOptionalAddress(procedure.forwarder) ??
        getDeployment(
          procedure.chainId ?? getDefaultChainId(),
          'MetaGasStation'
        )
      const initialize = await populateInitializeProcedure(
        {
          typeName: procedure.typeName,
          options: procedure.options ?? {},
          cid: procedure.cid ?? '',
          moderators,
          deciders,
          proposers,
          withModeration: procedure.withModeration ?? false,
          proposerMode: procedure.proposerMode ?? parsedData.proposerMode,
          moderatorMode: procedure.moderatorMode ?? parsedData.moderatorMode,
          voterMode,
          requireMemberMajority,
          forwarder,
          args: rawArgs.map(arg =>
            typeof arg === 'string'
              ? isAddress(arg as `0x${string}`) || arg.startsWith('0x')
                ? arg
                : /^-?\d+$/.test(arg)
                  ? toHex(BigInt(arg))
                  : toHex(arg)
              : arg
          )
        },
        clients
      )
      return {
        procedureType: getProcedureType(
          procedure.chainId ?? getDefaultChainId(),
          procedure.typeName
        ).address,
        data: initialize.data,
        salt: formatSalt(procedure.salt),
        options: procedure.options
      }
    })
  )

export const getProcedureClass = async (typeName: string) => {
  try {
    let procedureClass
    switch (typeName) {
      case 'erc20Vote':
        procedureClass = (await import('./erc20Vote')).ERC20VoteProcedure
        break
      case 'nomination':
        procedureClass = (await import('./nomination')).NominationProcedure
        break
      case 'vote':
        procedureClass = (await import('./vote')).VoteProcedure
        break
      default:
        throw new Error('Procedure type not found: ' + typeName)
    }
    return procedureClass
  } catch (error) {
    console.error('getProcedureClass', (error as Error).message)
    throw error
  }
}

export const populateInitializeProcedure = async (
  input: PopulateInitializeInput,
  clients: ContractClients
): Promise<PopulatedTransactionData> => {
  if (clients.walletClient == null) {
    throw new Error('Wallet client not connected.')
  }
  const procedureClass = await getProcedureClass(input.typeName!)
  try {
    return await procedureClass._populateInitialize(input, clients)
  } catch (error) {
    console.error('populateInitializeProcedure', (error as Error).message)
    throw error
  }
}

export const encodeProcedureInitialization = (
  abi: unknown,
  functionName: string,
  args: unknown[]
): PopulatedTransactionData => ({
  data: encodeDynamicFunctionData({
    abi,
    functionName,
    args
  })
})
