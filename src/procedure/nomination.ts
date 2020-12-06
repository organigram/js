import { web3 } from '../web3'
import ProcedureNominationContract from '@organigram/contracts/build/contracts/SimpleNominationProcedure.json'
import { getAccount } from '../web3'

export const INTERFACE = `0xc5f28e49` // nominate signature.

export class ProcedureNomination {
    private _address: Address
    public nominatersOrgan: Address = ""

    constructor ({ address, nominatersOrgan }: {
        address: Address
        nominatersOrgan: Address
    }) {
        this._address = address
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
        const contract = new web3.eth.Contract(ProcedureNominationContract.abi, this._address)
        const from = await getAccount()
        return from && contract.methods.nominate(moveKey).send({ from })
        .then(() => true)
        .catch((error:Error) => {
            console.error("Error while nominating.", this._address, moveKey, error.message)
            return false
        })
    }
}

export default ProcedureNomination