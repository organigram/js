import Organigram from './organigram';
import Organ from './organ';
import Procedure from './procedure';
import type { Address } from './types';
export interface GraphConstructor {
    organigram: Organigram;
}
export declare class Graph {
    private _organigram;
    organs: Organ[];
    procedures: Procedure[];
    constructor({ organigram }: GraphConstructor);
    addContracts(contracts: Address[]): Promise<Graph>;
    addOrgan(organ: Organ): Promise<Graph>;
    addProcedure(procedure: Procedure): Promise<Graph>;
    removeContracts(contracts: Address[]): Promise<Graph>;
    toString(): string;
    toJSON(): any;
    parseJSON(json: any): Graph;
}
export default Graph;
