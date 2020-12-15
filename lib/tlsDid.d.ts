import { NetworkConfig, Attribute } from './types';
export declare class TLSDID {
    private registry;
    private provider;
    private wallet;
    private contract;
    domain: string;
    attributes: Attribute[];
    expiry: Date;
    signature: string;
    chains: string[][];
    /**
     * //TODO Allow for general provider type, see ethr-did implementation
     * Creates an instance of tlsdid.
     * @param {string} ethereumPrivateKey - ethereum private key with enougth
     * funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS DID Contract Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    constructor(ethereumPrivateKey: string, networkConfig?: NetworkConfig);
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
     * @param {string} key - Signing tls key in pem format
     */
    registerContract(domain: string, key: string): Promise<void>;
    /**
     * Sets domain
     * @param {string} domain - tls:did:<domain>
     */
    private setDomain;
    /**
     * Adds attribute to DID Document
     * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
     * @param {string} value - Value stored in path
     * @param {string} key - Signing tls key in pem format
     */
    addAttribute(path: string, value: string, key: string): Promise<void>;
    /**
     * Sets expiry of TLS DID Contract
     * @param {Date} date - Expiry date
     * @param {string} key - Signing tls key in pem format
     */
    setExpiry(date: Date, key: string): Promise<void>;
    /**
     * Signs the TLS DID Contract
     * @param {string} key - Signing tls key in pem format
     */
    private signContract;
    /**
     * Gets address
     * @returns {string} address
     */
    getAddress(): string;
    /**
     * Stores certs in the TLS DID Certificate Contract
     * @dev Do not store root certificates, they are passed to the resolver
     * @todo What to do when cert expire / are invalid
     * @param certs
     * @param {string} key - Signing tls key in pem format
     */
    addChain(certs: string[], key: string): Promise<void>;
}
