import { OrganigramInput } from '../organigram';
/** Ready-made organigrams, from company forms (`sas`, `sarl`…) to registers. */
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
    nonProfit: {
        name: string;
        description: string;
        organs: {
            address: string;
            salt: string;
            name: string;
            description: string;
            entries: never[];
            permissions: {
                permissionValue: number;
                permissionAddress: string;
            }[];
        }[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            description: string;
            typeName: string;
            deciders: string;
            proposers: string;
            moderators: string;
            withModeration: boolean;
            data: string;
        }[];
        assets: never[];
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
    sas: OrganigramInput;
    sasu: OrganigramInput;
    sa: OrganigramInput;
    sarl: OrganigramInput;
    accountingRecords: {
        name: string;
        description: string;
        organs: {
            address: string;
            salt: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            withModeration: boolean;
            data: string;
        }[];
        assets: never[];
    };
    employmentSafetyRecords: {
        name: string;
        description: string;
        organs: {
            address: string;
            salt: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            withModeration: boolean;
            data: string;
        }[];
        assets: never[];
    };
    dataProcessingRegister: {
        name: string;
        description: string;
        organs: {
            address: string;
            salt: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            withModeration: boolean;
            data: string;
        }[];
        assets: never[];
    };
    corporateFilings: {
        name: string;
        description: string;
        organs: {
            address: string;
            salt: string;
            name: string;
            entries: never[];
            permissions: {
                permissionAddress: string;
                permissionValue: number;
            }[];
        }[];
        procedures: {
            address: string;
            salt: string;
            name: string;
            typeName: string;
            deciders: string;
            proposers: string;
            withModeration: boolean;
            data: string;
        }[];
        assets: never[];
    };
};
/** Name of a template. */
export type TemplateName = keyof typeof templates;
/** Tell whether a chain has every protocol contract a template needs. */
export declare const isTemplateSupportedOnChain: (templateName: TemplateName, chainId: string) => boolean;
/**
 * Give every contract of an organigram a new salt and address, and update the references between them.
 */
export declare const renewSaltsAndAddresses: (organigram: OrganigramInput, chainId: string) => OrganigramInput;
/**
 * Return a copy of a template, with new salts and addresses for the given chain.
 */
export declare const getTemplate: (templateName: TemplateName, chainId: string) => OrganigramInput;
