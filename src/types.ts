import { providers } from 'ethers';

export type Attribute = {
  path: string;
  value: string;
};

export type ProviderConfig = {
  provider?: providers.Provider;
  rpcUrl?: string;
  web3?: any;
};

export type NetworkConfig = {
  registry?: string;
  certRegistry?: string;
  providerConfig?: ProviderConfig;
};
