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
export declare const renewSaltsAndAddresses: (organigram: OrganigramInput, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        isDeployed: boolean;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        publicClient?: import("viem").PublicClient | null;
        walletClient?: import("viem").WalletClient | null;
        balance?: string | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        name?: string | null;
        description?: string | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        data: string;
        isDeployed: boolean;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: import("..").ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        publicClient?: import("viem").PublicClient | null;
        walletClient?: import("viem").WalletClient | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: import("..").ProcedureProposal[] | null;
        organigramId?: string | null;
    }[];
    assets: {
        chainId: string;
        isDeployed: boolean;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        symbol?: string | null;
        initialSupply?: number | null;
        image?: string | null;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: import("..").OrganigramClient | null;
    walletClient?: import("viem").WalletClient | null;
    publicClient?: import("viem").PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};
export declare const getTemplate: (templateName: TemplateName, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        isDeployed: boolean;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        publicClient?: import("viem").PublicClient | null;
        walletClient?: import("viem").WalletClient | null;
        balance?: string | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        name?: string | null;
        description?: string | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        data: string;
        isDeployed: boolean;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: import("..").ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        publicClient?: import("viem").PublicClient | null;
        walletClient?: import("viem").WalletClient | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: import("..").ProcedureProposal[] | null;
        organigramId?: string | null;
    }[];
    assets: {
        chainId: string;
        isDeployed: boolean;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        symbol?: string | null;
        initialSupply?: number | null;
        image?: string | null;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: import("..").OrganigramClient | null;
    walletClient?: import("viem").WalletClient | null;
    publicClient?: import("viem").PublicClient | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};
