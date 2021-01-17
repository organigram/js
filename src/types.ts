type CID = any
type Address = string
type Metadata = object | null
type Multihash = {
    ipfsHash: string
    hashFunction: string
    hashSize: string
}
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
} | string

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
    moves: ProcedureMove[]
    data?: any
}

type ProcedureMoveOperation = {
    index: string
    operationType: Number
    // uint8 with possible masks :
    // 0: operation on procedure.
    // 1/2/3: addEntry/removeEntry/replaceEntry.
    // 4/5/6: addProcedure/removeProcedure/replaceProcedure.
    // 7: withdraw funds.
    // 8: withdraw tokens.
    call: any
    processed: boolean
}

type ProcedureMove = {
    key: string
    creator: Address
    metadata: Metadata
    locked: boolean
    applied: boolean
    processing: boolean
    operations: ProcedureMoveOperation[]
}

type LibraryKey = "organ"|"procedure"|"voteProposition"
type Network = "mainnet"|"morden"|"ropsten"|"rinkeby"|"kovan"|"goerli"|"xdai"|"dev"|"organigr.am"|"private"

type Libraries = {
    organ: { network: string, address: Address }[],
    procedure: { network: string, address: Address }[],
    voteProposition: { network: string, address: Address }[]
}

interface LoadGraphOptions {
    contracts: Address[] | undefined
    organigram: any | undefined
}

// export declare const web3: any
// export declare const loadGraph: (options: Organigram.LoadGraphOptions) => Promise<Organigram.Graph>
// export declare const loadOrgan: (address: Organigram.Address) => Promise<Organigram.Organ>
// export declare const loadProcedure: (address: Organigram.Address) => Promise<Organigram.Procedure>