type CID = any
type Address = string
type Metadata = object
type ProcedureType = string
type ProcedureData = object

type Graph = {
    organs: Organ[]
    procedures: Procedure[]
}

type OrganProcedurePermissions = {
    canAddEntries: boolean
    canRemoveEntries: boolean
    canAddProcedures: boolean
    canRemoveProcedures: boolean
}

type OrganProcedure = {
    address: Address
    permissions: OrganProcedurePermissions
}

type Organ = {
    address: Address
    metadata: Metadata
    procedures: OrganProcedure[]
    entries: OrganEntry[]
}

type OrganEntry = {
    index: string
    address: Address
    cid?: CID|null
    data?: any // @todo : Check if Uint8Array could serve the purpose.
}

type Procedure = {
    address: Address
    metadata: Metadata
}

interface LoadGraphOptions {
    contracts: Address[] | undefined
    organigram: any | undefined
}
// export declare const web3: any
// export declare const loadGraph: (options: Organigram.LoadGraphOptions) => Promise<Organigram.Graph>
// export declare const loadOrgan: (address: Organigram.Address) => Promise<Organigram.Organ>
// export declare const loadProcedure: (address: Organigram.Address) => Promise<Organigram.Procedure>