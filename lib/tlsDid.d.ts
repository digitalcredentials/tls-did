import { NetworkConfig, Attribute } from '@digitalcredentials/tls-did-utils';
export declare class TLSDID {
    private provider;
    private wallet;
    private registry;
    registered: boolean;
    domain: string;
    attributes: Attribute[];
    expiry: Date;
    signature: string;
    chain: string[];
    /**
     * //TODO Allow for general provider type, see ethr-did implementation
     * Creates an instance of tlsdid.
     * @param {string} ethereumPrivateKey - ethereum private key with enough
     * funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS DID Contract Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    constructor(domain: any, ethereumPrivateKey: string, networkConfig?: NetworkConfig);
    loadDataFromRegistry(): Promise<void>;
    private queryChain;
    private getOwnership;
    private queryBlock;
    /**
     * Registers account to claimants of DID identifier( domain)
     */
    private register;
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
     * Stores certs in the TLS DID Certificate Contract
     * @dev Do not store root certificates, they are passed to the resolver
     * @todo What to do when cert expire / are invalid
     * @param certs
     * @param {string} key - Signing tls key in pem format
     */
    addChain(certs: string[], key: string): Promise<void>;
    /**
     * Stores certs in the TLS DID Certificate Contract
     * @dev Do not store root certificates, they are passed to the resolver
     * @todo What to do when cert expire / are invalid
     * @param certs
     * @param {string} key - Signing tls key in pem format
     */
    delete(): Promise<void>;
}
