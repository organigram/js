import { OrganigramJson } from '../organigram';
export declare const templates: {
    none: {
        organs: {
            salt: string;
            address: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            data: string;
            deciders: string;
            proposers: string;
            type: {
                name: string;
                label: string;
                description: string;
                fields: {
                    name: string;
                    label: string;
                    type: string;
                    description: string;
                    defaultValue: string;
                    options: null;
                }[];
            };
        }[];
        assets: never[];
    };
};
export declare const renewSaltsAndAddresses: (organigram: OrganigramJson, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        entries?: import("..").OrganEntry[];
        name?: string;
        description?: string;
        cid?: string;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        name?: string;
        description?: string;
        cid?: string;
        metadata?: unknown;
        withModeration?: boolean;
        forwarder?: string;
        proposals?: import("..").ProcedureProposal[];
        args?: unknown[];
    }[];
    assets: {
        chainId: string;
        salt: string;
        address: string;
        name?: string;
        symbol?: string;
        totalSupply?: string;
    }[];
};
export declare const getTemplate: (templateName: keyof typeof templates, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        entries?: import("..").OrganEntry[];
        name?: string;
        description?: string;
        cid?: string;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        name?: string;
        description?: string;
        cid?: string;
        metadata?: unknown;
        withModeration?: boolean;
        forwarder?: string;
        proposals?: import("..").ProcedureProposal[];
        args?: unknown[];
    }[];
    assets: {
        chainId: string;
        salt: string;
        address: string;
        name?: string;
        symbol?: string;
        totalSupply?: string;
    }[];
};
