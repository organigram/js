import Organ from './organ'
import Procedure from './procedure'

interface GraphData {
    organs: Organ[]
    procedures: Procedure[]
}

interface GraphAddresses {
    organs: Address[]
    procedures: Address[]
}

export class Graph {
    organs: Organ[] = []
    procedures: Procedure[] = []

    constructor({ organs, procedures }: GraphData) {
        this.organs = organs
        this.procedures = procedures
    }
    
    // Sort graph contracts but do not load them.
    static sort = async (contracts: Address[]): Promise<GraphAddresses> => {
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

    static load = async (contracts: Address[]): Promise<Graph> => {
        const { organs, procedures } = await Graph.sort(contracts)
        const graph = new Graph({
            organs: await Promise.all(organs.map(a => Organ.load(a))),
            procedures: await Promise.all(procedures.map(a => Procedure.load(a)))
        })
        return graph
    }

    addContracts = async (contracts: Address[]): Promise<Graph> => {
        const { organs, procedures } = await Graph.sort(contracts)
        const newOrgans: Organ[] = await Promise.all(organs
            .filter(a => !this.organs.find(to => to.address === a))
            .map(a => Organ.load(a)))
        const newProcedures: Procedure[] = await Promise.all(procedures
            .filter(a => !this.procedures.find(to => to.address === a))
            .map(a => Procedure.load(a)))
        return new Graph({
            organs: [...this.organs, ...newOrgans],
            procedures: [...this.procedures, ...newProcedures]
        })
    }

    removeContracts = async (contracts: Address[]): Promise<Graph> => {
        const organs: Organ[] = this.organs.filter(o => contracts.indexOf(o.address) < 0)
        const procedures: Procedure[] = this.procedures.filter(p => contracts.indexOf(p.address) < 0)
        return new Graph({ organs, procedures })
    }

    toString = (): string => JSON.stringify({
        organs: this.organs.map(o => o.toString()),
        procedures: this.procedures.map(o => o.toString())
    }, null, 2)
}

export default Graph