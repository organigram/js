import { web3 } from './web3'
import Organ, { OrganData } from './organ'
import Procedure, { ProcedureData } from './procedure'
import KelsenABI from '@organigram/contracts/abis/Kelsen.json'

interface GraphData {
    organs: Organ[]
    procedures: Procedure[]
}

interface GraphAddresses {
    organs: Address[]
    procedures: Address[]
}

export class Graph {
    private organs: Organ[] = []
    private procedures: Procedure[] = []

    constructor({ organs, procedures }: GraphData) {
        this.organs = organs
        this.procedures = procedures
    }
    
    // Sort graph contracts but do not load them.
    public static async sort(contracts: Address[]): Promise<GraphAddresses> {
        let organs: Address[] = [], procedures: Address[] = []
        for await (var address of contracts) {
            // @ts-ignore
            const contract = await new web3.eth.Contract(KelsenABI, address)
            const isOrgan = await contract.methods.isOrgan().call()
            const isProcedure = await contract.methods.isProcedure().call()
            if (isOrgan)
                organs.push(address)
            if (isProcedure)
                procedures.push(address)
        }
        return { organs, procedures }
    }

    public static async load(contracts: Address[]): Promise<Graph> {
        const sortedContracts = await Graph.sort(contracts)
        let organs: Organ[] = [], procedures: Procedure[] = []
        for await (var address of sortedContracts.organs) {
            const organ = await Organ.load(address)
            organs.push(organ)
        }
        for await (var address of sortedContracts.procedures) {
            const procedure = await Procedure.load(address)
            procedures.push(procedure)
        }
        return new Graph({ organs, procedures})
    }

    public toString = (): string => JSON.stringify({
        organs: this.organs.map(o => o.toString()),
        procedures: this.procedures.map(o => o.toString())
    }, null, 2)

    public addOrgans = async (organs: OrganData[]): Promise<Graph> => {
        this.organs = [
            ...this.organs,
            ...organs.map(data => new Organ(data))
        ]
        return this
    }

    public addProcedures = async (procedures: ProcedureData[]): Promise<Graph> => {
        this.procedures = [
            ...this.procedures,
            ...procedures.map(data => new Procedure(data))
        ]
        return this
    }
}

export default Graph