import ProcedureNominationContract from '@organigram/contracts/build/contracts/NominationProcedure.json'
import { web3, getAccount } from '../web3'
import { cidToMultihash } from '../ipfs'
import Procedure from '../procedure'

export default class ProcedureNomination extends Procedure {
    static INTERFACE = `0xc5f28e49` // nominate() signature.
    private contract:any

    // Constructor needs to call Procedure constructor.
    constructor(
        address:Address,
        metadata:CID|null,
        proposers:Address,
        moderators:Address,
        deciders:Address,
        withModeration:boolean,
        proposals:ProcedureProposal[]
    ) {
        super(
            address,
            metadata,
            proposers,
            moderators,
            deciders,
            withModeration,
            proposals
        )
        // @ts-ignore
        this.contract = new web3.eth.Contract(ProcedureNominationContract.abi, address)
    }

    // initialize() overrides Procedure initialize.
    static async initialize(
        address:Address,
        metadata:CID,
        proposers:Address,
        moderators:Address,
        deciders:Address,
        _withModeration:Boolean,
        ..._args:any[]
    ):Promise<void> {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureNominationContract.abi)
        const from = await getAccount()
        const multihash = cidToMultihash(metadata)
        if (!multihash)
            throw new Error("Wrong CID.")
        await contract.methods.initialize(
            address,
            multihash,
            proposers,
            moderators,
            deciders,
            false
        )
        .send({ from })
    }

    static async load(address: Address): Promise<ProcedureNomination> {
        const procedure = await Procedure.load(address)
        if (!procedure)
            throw new Error("Not a valid procedure.")
        return new ProcedureNomination(
            procedure.address,
            procedure.metadata,
            procedure.proposers,
            procedure.moderators,
            procedure.deciders,
            procedure.withModeration,
            procedure.proposals
        )
    }
    
    async nominate(proposalKey:string):Promise<boolean> {
        const from = await getAccount()
        return from && this.contract.methods.nominate(proposalKey).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while nominating.", super.address, proposalKey, error.message)
            return false
        })
    }
}