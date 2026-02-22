import { ethers, ContractTransaction } from 'ethers'

// import { ERC20VoteProcedure } from './erc20Vote'
// import { NominationProcedure } from './nomination'
// import { VoteProcedure } from './vote'
import { OrganEntry } from '../organ'
import {
  DeployOrganInput,
  DeployProceduresInput,
  TransactionOptions
} from '../organigramClient'
import {
  createRandom32BytesHexId,
  deployedAddresses,
  formatSalt
} from '../utils'

export type ProcedureTypeName = 'erc20Vote' | 'nomination' | 'vote'
export enum ProcedureTypeNameEnum {
  erc20Vote = 'erc20Vote',
  nomination = 'nomination',
  vote = 'vote'
}
export interface PopulateInitializeInput {
  options?: {
    signer?: ethers.Signer
  } & TransactionOptions
  typeName?: ProcedureTypeName
  cid: string
  proposers: string
  moderators: string
  deciders: string
  withModeration: boolean
  forwarder: string
  args: unknown[]
}

export const nomination = {
  key: 'nomination',
  address: deployedAddresses[11155111].NominationProcedure,
  metadata: {
    label: 'Nomination',
    description:
      'A nomination allows any member in the source organ to directly edit entries, assets or permissions in the target organ.'
  },
  fields: {}
}

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
      'Duration of the vote phase, as a number of seconds. Default: 3600 seconds (1 hour)',
    defaultValue: '3600',
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

export const vote = {
  key: 'vote',
  address: deployedAddresses[11155111].VoteProcedure,
  metadata: {
    label: 'Simple Majority Vote',
    description:
      'A vote allows any user in the source organ to vote on proposals to add, edit or replace one or many entries, assets or permissions in the target organ.'
  },
  fields: electionFields
}

export const procedureMetadata = {
  _type: 'procedureType',
  _generator: 'https://organigram.ai',
  _generatedAt: 0
}

export const erc20Vote = {
  address: deployedAddresses[11155111].ERC20VoteProcedure,
  key: 'erc20Vote',
  fields: {
    ...electionFields,
    erc20: {
      name: 'erc20',
      label: 'ERC20 Token',
      description:
        'Address of the ERC20 Token used for weighting the voting power.',
      defaultValue: '',
      type: 'string'
    }
  },
  metadata: {
    ...procedureMetadata,
    label: 'Token-weighted Vote',
    description:
      'A token vote allows any member in the source organ to vote on proposals, where their voting power is based on the amount of tokens they hold.',
    type: 'erc20Vote'
  }
}

export const procedureTypes = {
  erc20Vote,
  nomination,
  vote
}

export const prepareDeployOrgansInput = (
  deployOrgansInput: DeployOrganInput[]
) =>
  deployOrgansInput.map(organ => {
    const _permissionAddresses: string[] = []
    const _permissionValues: string[] = []
    organ.permissions?.forEach(p => {
      _permissionAddresses.push(p.permissionAddress)
      _permissionValues.push(
        ethers.zeroPadValue(ethers.toBeHex(p.permissionValue), 2)
      )
    })
    const entries =
      organ.entries?.map((e: OrganEntry) => ({
        addr: e.address,
        cid: e.cid ?? ''
      })) ?? []
    return {
      permissionAddresses: _permissionAddresses,
      permissionValues: _permissionValues,
      cid: organ.cid ?? '',
      entries,
      salt: organ.salt ?? createRandom32BytesHexId()
    }
  })

export const prepareDeployProceduresInput = async (
  deployProceduresInput: DeployProceduresInput[],
  signer: ethers.Signer
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
      const _args = procedure.args ?? Object.values(parsedData)
      const initialize = await populateInitializeProcedure(
        {
          typeName: procedure.typeName,
          options: procedure.options ?? {},
          cid: procedure.cid ?? '',
          moderators: procedure.moderators ?? ethers.ZeroAddress,
          deciders: procedure.deciders,
          proposers: procedure.proposers ?? procedure.deciders,
          withModeration: procedure.withModeration ?? false,
          forwarder:
            procedure.forwarder ??
            deployedAddresses[procedure.chainId as '11155111']?.MetaGasStation,
          // Convert any string arguments to hex number, to ensure they are correctly encoded in the transaction data
          args: _args.map(arg =>
            typeof arg === 'string'
              ? ethers.isHexString(arg)
                ? arg
                : ethers.toBeHex(arg)
              : arg
          )
        },
        signer
      )
      return {
        procedureType:
          procedureTypes[procedure.typeName as keyof typeof procedureTypes]
            .address,
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
  signer: ethers.Signer
): Promise<ContractTransaction> => {
  if (signer == null) {
    throw new Error('Signer not connected.')
  }
  const procedureClass = await getProcedureClass(input.typeName!)
  try {
    const chainId = await signer.provider
      ?.getNetwork()
      .then(n => n.chainId.toString())
    return await procedureClass._populateInitialize({
      options: { ...input.options, signer },
      cid: input.cid ?? '',
      proposers: input.proposers ?? input.deciders,
      moderators: input.moderators ?? ethers.ZeroAddress,
      deciders: input.deciders,
      withModeration: input.withModeration ?? false,
      forwarder:
        input.forwarder ??
        deployedAddresses[chainId as '11155111']?.MetaGasStation,
      args: input.args
    })
  } catch (error) {
    console.error('populateInitializeProcedure', (error as Error).message)
    throw error
  }
}
