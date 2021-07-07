import Graph from './graph';
import Organ from './organ';
import Procedure from './procedure';
import { CID } from './ipfs';
import type { Address, Metadata, Network } from './types';
export interface File {
    cid: CID;
    data: any;
}
export declare type ProcedureType = {
    key: string;
    label: string;
    address: Address;
    metadata: Metadata;
    Class: any;
};
export declare type EnhancedProcedure = Procedure & {
    type: ProcedureType;
};
export declare class Organigram {
    private _contract;
    address: Address;
    network: Network;
    proceduresRegistry: Organ;
    procedureTypes: ProcedureType[];
    organs: Organ[];
    procedures: EnhancedProcedure[];
    graphs: Graph[];
    cids: File[];
    constructor(address: Address, network: Network, proceduresRegistry: Organ, procedureTypes: ProcedureType[]);
    static loadProcedureType({ addr, doc }: {
        addr: Address;
        doc?: CID;
    }): Promise<ProcedureType>;
    static loadProcedureTypes(address: Address): Promise<ProcedureType[]>;
    static load(address: Address): Promise<Organigram>;
    getProcedureType(address: Address): Promise<ProcedureType | null>;
    getOrgan(address: Address, cached?: boolean): Promise<Organ>;
    getProcedure(address: Address, cached?: boolean): Promise<EnhancedProcedure>;
    getContract(address: Address, cached?: boolean): Promise<Organ | EnhancedProcedure | null>;
    createOrgan(metadata: CID, admin?: Address): Promise<Organ>;
    createProcedure(type: Address, metadata: Metadata, proposers: Address, moderators: Address, deciders: Address, withModeration: boolean, ...args: any[]): Promise<EnhancedProcedure>;
    cidToJson(cid: CID, cached?: boolean): Promise<any>;
    deployGraph(graph: Graph): Promise<Graph>;
}
export default Organigram;
