import { web3 } from '../web3'
import ProcedureNominationContract from '@organigram/contracts/build/contracts/SimpleNominationProcedure.json'

export const INTERFACE = `0xc5f28e49` // nominate signature.

export class ProcedureNomination {
    public address: Address = ""
    public nominatersOrgan: Address = ""

    constructor ({ address, nominatersOrgan }: {
        address: Address
        nominatersOrgan: Address
    }) {
        this.address = address
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
        const nomination = new ProcedureNomination({ address, nominatersOrgan })
        return nomination
    }
    
    public nominate = async (moveKey: string):Promise<boolean> => {
        // @ts-ignore
        const contract = new web3.eth.Contract(ProcedureNominationContract.abi, this.address)
        return await contract.methods.nominate(moveKey)
        .send({ from: web3.eth.defaultAccount })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while adding special call in move.", this.address, moveKey, error.message)
            return false
        })
    }
}

export default ProcedureNomination