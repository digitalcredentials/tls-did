import { providers } from 'ethers';
import { ProviderConfig } from './types';
/**
 * Splits string of pem keys to array of pem keys
 * @param {string} chain - String of aggregated pem certs
 * @return {string[]} - Array of pem cert string
 */
export declare function chainToCerts(chain: string): string[];
/**
 * Signs data with pem private key
 * @param {string} key - Signing key in pem format
 * @param {string} data
 */
export declare function sign(key: string, data: string): string;
/**
 * Returns the configured provider
 * @param {ProviderConfig} conf - Configuration for provider
 */
export declare function configureProvider(conf?: ProviderConfig): providers.Provider;
