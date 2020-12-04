import { web3 } from '../web3'
import ProcedureVoteContract from '@organigram/contracts/build/contracts/VoteProcedure.json'
import { getAccount } from '../web3'

export const INTERFACE = `0xc9d27afe` // vote signature.

export interface ProcedureVoteData  {
    votersOrgan: Address
    vetoersOrgan: Address
    enactorsOrgan: Address
}

export class ProcedureVote {
    public votersOrgan: Address
    public vetoersOrgan: Address
    public enactorsOrgan: Address

    constructor ({ votersOrgan, vetoersOrgan, enactorsOrgan }: ProcedureVoteData) {
        this.votersOrgan = votersOrgan
        this.vetoersOrgan = vetoersOrgan
        this.enactorsOrgan = enactorsOrgan
    }

    public static load = async (address: Address): Promise<ProcedureVote> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureVoteContract.abi, address)
        const votersOrgan:Address = await contract.methods.votersOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading voters organ address in vote procedure.", address, error.message)
            return ""
        })
        const vetoersOrgan:Address = await contract.methods.vetoersOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading vetoers organ address in vote procedure.", address, error.message)
            return ""
        })
        const enactorsOrgan:Address = await contract.methods.enactorsOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading enactors organ address in vote procedure.", address, error.message)
            return ""
        })
        return new ProcedureVote({ votersOrgan, vetoersOrgan, enactorsOrgan })
    }
}

export default ProcedureVote