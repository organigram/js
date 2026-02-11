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
};
export declare const renewSaltsAndAddresses: (organigram: OrganigramInput, chainId: string) => {
    chainId: string;
    organs: {
        salt: string;
        address: string;
        chainId: string;
        permissions: {
            permissionAddress: string;
            permissionValue: number;
        }[] | undefined;
        signerOrProvider?: import("ethers").Signer | import("ethers").Provider | null;
        balance?: bigint | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        isDeployed?: boolean | null;
        name?: string | null;
        description?: string | null;
        isSource?: import("..").SourceOrgan[] | null;
        isTarget?: import("..").TargetOrgan[] | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: import("..").ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        signerOrProvider?: import("ethers").Signer | import("ethers").Provider | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: import("..").ProcedureProposal[] | null;
        isDeployed?: boolean | null;
        sourceOrgans?: import("..").SourceOrgan[] | null;
        targetOrgans?: import("..").TargetOrgan[] | null;
        organigramId?: string | null;
        data?: string | null;
    }[];
    assets: {
        chainId: string;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        contract?: import("ethers").Contract | null;
        symbol?: string | null;
        totalSupply?: string | null;
        isSourceOrgan?: import("..").SourceOrgan[];
        image?: string | null;
        isDeployed?: boolean;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: import("..").OrganigramClient | null;
    signer?: import("ethers").Signer | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
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
        signerOrProvider?: import("ethers").Signer | import("ethers").Provider | null;
        balance?: bigint | null;
        cid?: string | null;
        entries?: Array<{
            index: string;
            address: string;
            cid: string;
        }> | null;
        isDeployed?: boolean | null;
        name?: string | null;
        description?: string | null;
        isSource?: import("..").SourceOrgan[] | null;
        isTarget?: import("..").TargetOrgan[] | null;
        organigramId?: string | null;
        forwarder?: string | null;
    }[];
    procedures: {
        salt: string;
        chainId: string;
        address: string;
        deciders: string;
        proposers: string;
        moderators: string | undefined;
        typeName: string;
        type?: import("..").ProcedureType;
        name?: string | null;
        description?: string | null;
        cid?: string | null;
        signerOrProvider?: import("ethers").Signer | import("ethers").Provider | null;
        metadata?: string | null;
        withModeration?: boolean | null;
        forwarder?: string | null;
        proposals?: import("..").ProcedureProposal[] | null;
        isDeployed?: boolean | null;
        sourceOrgans?: import("..").SourceOrgan[] | null;
        targetOrgans?: import("..").TargetOrgan[] | null;
        organigramId?: string | null;
        data?: string | null;
    }[];
    assets: {
        chainId: string;
        salt: string;
        address: string;
        name?: string | null;
        description?: string | null;
        contract?: import("ethers").Contract | null;
        symbol?: string | null;
        totalSupply?: string | null;
        isSourceOrgan?: import("..").SourceOrgan[];
        image?: string | null;
        isDeployed?: boolean;
        userBalance?: string | null;
        organigramId?: string | null;
    }[];
    id?: string | null;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    organigramClient?: import("..").OrganigramClient | null;
    signer?: import("ethers").Signer | null;
    contractAddresses?: string[] | null;
    workspaceId?: string | null;
};
