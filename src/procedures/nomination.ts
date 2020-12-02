import { web3 } from '../web3'
import ProcedureNominationContract from '@organigram/contracts/build/contracts/SimpleNominationProcedure.json'

export interface ProcedureNominationData  {
    nominatersOrgan: Address
}

export class ProcedureNomination {
    public nominatersOrgan: Address = ""

    constructor ({ nominatersOrgan }: ProcedureNominationData) {
        this.nominatersOrgan = nominatersOrgan
    }

    public static load = async (address: Address): Promise<ProcedureNomination> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureNominationContract.abi, address)

        const nominatersOrgan = await contract.methods.nominatersOrgan().call()
        .catch((error: Error) => {
            console.warn("Error while loading nominator in nomination procedure.", address, error.message)
            return ""
        })
        return new ProcedureNomination({ nominatersOrgan })
    }
}

export default ProcedureNomination