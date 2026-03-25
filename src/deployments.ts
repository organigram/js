import rawDeployedAddresses from '@organigram/protocol/deployments.json'

export type ProtocolDeploymentName =
  | 'CoreLibrary'
  | 'OrganLibrary'
  | 'ProcedureLibrary'
  | 'Asset'
  | 'Organ'
  | 'ERC20VoteProcedure'
  | 'NominationProcedure'
  | 'VoteProcedure'
  | 'MetaGasStation'
  | 'OrganigramClient'
  | 'CloneableOrgan'
  | 'CloneableAsset'

export type ProtocolDeployments = Record<
  string,
  Record<ProtocolDeploymentName, string>
>

const deployedAddresses: ProtocolDeployments = rawDeployedAddresses

export default deployedAddresses
