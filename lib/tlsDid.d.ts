import { ProviderConfig, Attribute } from './types';
export declare class TLSDID {
    private registry;
    private pemPrivateKey;
    private provider;
    private wallet;
    private contract;
    domain: string;
    attributes: Attribute[];
    expiry: Date;
    signature: string;
    /**
     * //TODO Allow for general provider type, see ethr-did implementation
     * Creates an instance of tlsdid.
     * @param {string} pemPrivateKey - TLS private key
     * @param {string} ethereumPrivateKey - ethereum private key with enougth
     * funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS DID Contract Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    constructor(pemPrivateKey: string, ethereumPrivateKey: string, registry: string, providerConfig: ProviderConfig);
    /**
     * Connects to existing TLS DID contract
     * @param {string} address - ethereum address of existing TLS DID Contract
     */
    connectToContract(address: string): Promise<void>;
    /**
     * Deploys TLS DID Contract
     */
    deployContract(): Promise<void>;
    /**
     * Registers TLS DID Contract with TLS DID Registry
     * @param {string} domain - tls:did:<domain>
     */
    registerContract(domain: string): Promise<void>;
    /**
     * Sets domain
     * @param {string} domain - tls:did:<domain>
     */
    private setDomain;
    /**
     * Adds attribute to DID Document
     * @param {string} path - Path of value, format 'parent/child'
     * @param {string} value - Value stored in path
     */
    addAttribute(path: string, value: string): Promise<void>;
    /**
     * Sets expiry of TLS DID Contract
     * @param {Date} date - Expiry date
     */
    setExpiry(date: Date): Promise<void>;
    /**
     * Signs the TLS DID Contract
     */
    private signContract;
    /**
     * Gets address
     * @returns {string} address
     */
    getAddress(): string;
}
