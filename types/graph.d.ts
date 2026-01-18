import { type ethers } from 'ethers'
import type Organigram from './organigram'
import Organ from './organ'
import Procedure from './procedure'
export interface GraphConstructor {
    organigram: Organigram;
}
export declare class Graph {
    private readonly _organigram
    organs: Organ[]
    procedures: Procedure[]
    constructor ({ organigram }: GraphConstructor)
    addContracts (contracts: string[]): Promise<Graph>
    addOrgan (organ: Organ, wallet: ethers.Wallet): Promise<Graph>
    addProcedure (procedure: Procedure, signerOrProvider: ethers.Signer | ethers.Provider): Promise<Graph>
    removeContracts (contracts: string[]): Promise<Graph>
    toJSON (): string
    static fromJSON (json: string): {
        organs: Organ[];
        procedures: Procedure[];
    }
    export (): {
        organs: Organ[];
        procedures: Procedure[];
    }
    import (object: {
        organs: Organ[];
        procedures: Procedure[];
    }): Graph
}
export default Graph
