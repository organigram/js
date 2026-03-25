export type ProtocolDeploymentName = 'CoreLibrary' | 'OrganLibrary' | 'ProcedureLibrary' | 'Asset' | 'Organ' | 'ERC20VoteProcedure' | 'NominationProcedure' | 'VoteProcedure' | 'MetaGasStation' | 'OrganigramClient' | 'CloneableOrgan' | 'CloneableAsset';
export type ProtocolDeployments = Record<string, Record<ProtocolDeploymentName, string>>;
declare const deployedAddresses: ProtocolDeployments;
export default deployedAddresses;
