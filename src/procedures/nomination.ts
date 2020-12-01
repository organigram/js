import { web3 } from '../web3'
import ProcedureNominationContract from '@organigram/contracts/build/contracts/SimpleNominationProcedure.json'

export interface ProcedureNominationData  {
    organNominator: Address
}

export class ProcedureNomination {
    public organNominator: Address = ""

    constructor ({ organNominator }: ProcedureNominationData) {
        this.organNominator = organNominator
    }

    public static load = async (address: Address): Promise<ProcedureNomination> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureNominationContract.abi, address)

        const organNominator = await contract.methods.organNominator().call()
        .catch((error: Error) => {
            console.warn("Error while loading nominator in nomination procedure.", address, error.message)
            return ""
        })
        return new ProcedureNomination({ organNominator })
    }
}

export default ProcedureNomination