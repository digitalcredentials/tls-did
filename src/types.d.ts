import { providers } from 'ethers';

interface IAttribute {
  path: string;
  value: string;
}

interface IProviderConfig {
  provider?: providers.Provider;
  rpcUrl?: string;
  web3?: any;
}
