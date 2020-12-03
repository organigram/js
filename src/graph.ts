import Organ, { OrganData } from './organ'
import Procedure, { ProcedureData } from './procedure'

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
            const isOrgan = await Organ.isOrgan(address)
            const isProcedure = await Procedure.isProcedure(address)
            if (isOrgan)
                organs.push(address)
            if (isProcedure)
                procedures.push(address)
        }
        return { organs, procedures }
    }

    public static async load(contracts: Address[]): Promise<Graph> {
        const { organs, procedures } = await Graph.sort(contracts)
        const graph = new Graph({
            organs: await Promise.all(organs.map(a => Organ.load(a))),
            procedures: await Promise.all(procedures.map(a => Procedure.load(a)))
        })
        return graph
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