type CID = any
type Address = string
type Metadata = object | null
type Multihash = {
    ipfsHash: string
    hashFunction: string
    hashSize: string
}

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

type OrganEntry = {
    index: string
    address: Address
    cid?: CID|null
    data?: any // @todo : Check if Uint8Array could serve the purpose.
}

type Organ = {
    address: Address
    metadata: Metadata
    procedures: OrganProcedure[]
    entries: OrganEntry[]
}

type OperationTag = "metadata"
    |"entries"
    |"procedures"
    |"coins"
    |"collectibles"
    |"funds"
    |"add"
    |"replace"
    |"remove"
    |"deposit"
    |"withdraw"
    |"transfer"

type OperationParamType = "metadata"|"entry"|"entries"|"address"|"addresses"|"index"|"indexes"|"organ"|"procedure"|"permissions"|"proposal"|"proposals"
type OperationParamAction = "select"|"create"|"update"|"delete"|"withdraw"|"deposit"|"transfer"|"block"

type OperationParam = {
    type: string
    action?: OperationParamAction   // Used to generate form UI.
    value?: any         // Used to display an operation
    parser?: Function   // Used to parse a submitted form
}

type ProcedureProposalOperationFunction = {
    funcSig: string,
    key: string,
    signature?: string,
    label?: string,
    tags?: OperationTag[]
    params?: OperationParamType[]
    abi?: any
    target?: "organ"|"self"
}

type ProcedureProposalOperation = {
    index: string
    functionSelector: string
    organ?: Address
    data: string
    value?: string
    processed?: boolean
    function?: ProcedureProposalOperationFunction
    params?: OperationParam[]
    userIsInOrgan?: boolean
    userIsInEntry?: boolean
    // @todo : generate a text from operation params.
    description?:any
}

type ProcedureProposal = {
    key: string
    creator: Address
    metadata?: CID
    blockReason?: CID
    presented: boolean
    blocked: boolean
    adopted: boolean
    applied: boolean
    operations: ProcedureProposalOperation[]
}

type Procedure = {
    address: Address
    type: Address
    metadata: Metadata
    moves: ProcedureProposal[]
    data?: any
    userIsProposer?: boolean
    userIsModerator?: boolean
    userIsDecider?: boolean
}

type LibraryKey = "organ"|"procedure"|"metadata"
type Network = "mainnet"|"morden"|"ropsten"|"rinkeby"|"kovan"|"goerli"|"xdai"|"dev"|"organigr.am"|"private"

type Libraries = {
    organ: { network: string, address: Address }[],
    procedure: { network: string, address: Address }[],
    metadata: { network: string, address: Address }[]
}

interface LoadGraphOptions {
    contracts: Address[] | undefined
    organigram: any | undefined
}

// export declare const web3: any
// export declare const loadGraph: (options: Organigram.LoadGraphOptions) => Promise<Organigram.Graph>
// export declare const loadOrgan: (address: Organigram.Address) => Promise<Organigram.Organ>
// export declare const loadProcedure: (address: Organigram.Address) => Promise<Organigram.Procedure>