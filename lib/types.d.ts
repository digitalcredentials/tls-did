import { providers } from 'ethers';
export declare type Attribute = {
    path: string;
    value: string;
};
export declare type ProviderConfig = {
    provider?: providers.Provider;
    rpcUrl?: string;
    web3?: any;
};
export declare type NetworkConfig = {
    registry?: string;
    providerConfig?: ProviderConfig;
};
