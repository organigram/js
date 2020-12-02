import { web3 } from '../web3'
import ProcedureVoteContract from '@organigram/contracts/build/contracts/VoteProcedure.json'

export interface ProcedureVoteData  {
    movesLength: Number
}

export class ProcedureVote {
    public movesLength: Number = 0

    constructor ({ movesLength }: ProcedureVoteData) {
        this.movesLength = movesLength
    }

    public static load = async (address: Address): Promise<ProcedureVote> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)

        const movesLength = await contract.methods.getMovesLength().call()
        .catch((error: Error) => {
            console.warn("Error while loading nominator in nomination procedure.", address, error.message)
            return ""
        })
        return new ProcedureVote({ movesLength })
    }
}

export default ProcedureVote