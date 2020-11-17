import { providers } from 'ethers';
import { ProviderConfig } from './types';
/**
 * Signs data with pem private key
 * @param pemPrivateKey
 * @param data
 */
export declare function sign(pemPrivateKey: string, data: string): string;
/**
 * Returns the configured provider
 * @param {ProviderConfig} conf - Configuration for provider
 */
export declare function configureProvider(conf?: ProviderConfig): providers.Provider;
