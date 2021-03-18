import { providers } from 'ethers';
import { ProviderConfig } from '@digitalcredentials/tls-did-utils';

/**
 * Splits string of pem keys to array of pem keys
 * @param {string} chain - String of aggregated pem certs
 * @return {string[]} - Array of pem cert string
 */
export function chainToCerts(chain: string): string[] {
  return chain.split(/\n(?=-----BEGIN CERTIFICATE-----)/g);
}

/**
 * Returns the configured provider
 * @param {ProviderConfig} conf - Configuration for provider
 */
export function configureProvider(
  conf: ProviderConfig = {}
): providers.Provider {
  if (conf.provider) {
    return conf.provider;
  } else if (conf.rpcUrl) {
    return new providers.JsonRpcProvider(conf.rpcUrl);
  } else if (conf.web3) {
    return new providers.Web3Provider(conf.web3.currentProvider);
  } else {
    return new providers.JsonRpcProvider('http://localhost:8545');
  }
}
