import Organigram from './organigram'
import Organ from './organ'
import Procedure from './procedure'

export interface GraphConstructor {
    organigram: Organigram
}
export class Graph {
    private _organigram:Organigram
    organs:Organ[] = []
    procedures:Procedure[] = []

    constructor({ organigram }:GraphConstructor) {
        this._organigram = organigram
    }

    async addContracts(contracts: Address[]):Promise<Graph> {
        if (!this._organigram)
            throw new Error("Organigram not loaded.")
        // Remove existing contracts from the new array.
        contracts = contracts.filter((c:Address) => {
            c = c.toLowerCase()
            return !this.organs.find(o => o.address.toLowerCase() === c)
                && !this.procedures.find(p => p.address.toLowerCase() === c)
        })
        const instances = await Promise.all(contracts.map((c:Address) => this._organigram.getContract(c).catch(() => null)))
        .catch(error => {
            console.error("Error loading new contracts", error.message)
            return []
        })
        instances.forEach((i) => {
            if (i) {
                if (i instanceof Organ)
                    this.organs.push(i)
                if (i instanceof Procedure)
                    this.procedures.push(i)
            }
        })
        return this
    }

    async addOrgan(organ:Organ):Promise<Graph> {
        const _isOrgan = await Organ.isOrgan(organ.address)
        if (_isOrgan)
            this.organs.push(organ)
        return this
    }

    async addProcedure(procedure:Procedure):Promise<Graph> {
        const _isProcedure = await Organ.isOrgan(procedure.address)
        if (_isProcedure)
            this.procedures.push(procedure)
        return this
    }

    async removeContracts(contracts: Address[]):Promise<Graph> {
        this.organs = this.organs.filter(o => contracts.indexOf(o.address) < 0)
        this.procedures = this.procedures.filter(p => contracts.indexOf(p.address) < 0)
        return this
    }

    toString():string {
        return JSON.stringify({
            organs: this.organs.map(o => o.toString()),
            procedures: this.procedures.map(o => o.toString())
        }, null, 2)
    }

    toJSON():any {
        return {
            organs: this.organs, // .map(o => o.toJSON()),
            procedures: this.procedures, // .map(p => p.toJSON())
        }
    }
    
    parseJSON(json:any):Graph {
        this.organs = json.organs
        this.procedures = json.procedures
        return this
    }
}

export default Graph