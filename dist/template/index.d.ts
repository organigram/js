import { OrganigramInput } from '../organigram';
export declare const templates: {
    none: {
        name: string;
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
        }[];
        assets: never[];
    };
    forProfit: {
        name: string;
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
        }[];
        assets: {
            salt: string;
            address: string;
            name: string;
            symbol: string;
        }[];
    };
    nonProfit: {
        name: string;
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
        procedures: ({
            salt: string;
            address: string;
            name: string;
            typeName: string;
            data: string;
            deciders: string;
            proposers: string;
        } | {
            salt: string;
            address: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            data?: undefined;
        })[];
        assets: {
            salt: string;
            address: string;
            name: string;
            symbol: string;
        }[];
    };
    openSource: {
        name: string;
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
            deciders: string;
            proposers: string;
        }[];
        assets: never[];
    };
    participatoryBudget: {
        name: string;
        organs: {
            name: string;
            address: string;
            salt: string;
            entries: never[];
            permissions: {
                permissionValue: number;
                permissionAddress: string;
            }[];
        }[];
        assets: never[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            data: string;
        }[];
    };
};
export type TemplateName = keyof typeof templates;
export declare const renewSaltsAndAddresses: (organigram: OrganigramInput, chainId: string) => OrganigramInput;
export declare const getTemplate: (templateName: TemplateName, chainId: string) => OrganigramInput;
