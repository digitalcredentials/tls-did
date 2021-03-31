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
     * Initializes TLS-DID object
     * @param {string} ethereumPrivateKey - ethereum private key with enough funds to pay for transactions
     * @param {string} [registry] - ethereum address of TLS-DID Registry
     * @param {IProviderConfig} providerConfig - config for ethereum provider {}
     */
    constructor(domain: any, ethereumPrivateKey: string, networkConfig?: NetworkConfig);
    /**
     * Read data previously stored on chain for ethereum account and TLS-DID identifier (domain) combination
     */
    loadDataFromRegistry(): Promise<void>;
    /**
     * Query chain with a set of event filters
     * @param {EventFilter[]} filters - Filters by which to query the chain
     * @param {number} block - Block on which the query is started
     */
    private queryChain;
    /**
     * Reads registration state from chain
     */
    private getOwnership;
    /**
     * Query block with a set of event filters
     * @param {EventFilter[]} filters - Filters by which to query the block
     * @param {number} block - Number of block to query
     */
    private queryBlock;
    /**
     * Adds ethereum account to claimants of TLS-DID identifier (domain)
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    register(gasLimit?: number): Promise<void>;
    /**
     * Adds attribute to TLS-DID Document stored on chain
     * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
     * @param {string} value - Value stored in path
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    addAttribute(path: string, value: string, gasLimit?: number): Promise<void>;
    /**
     * Updates expiry of TLS-DID on chain
     * @param {Date} date - Expiry date
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    setExpiry(date: Date, gasLimit?: number): Promise<void>;
    /**
     * Updates signature stored on chain
     * @param {string} key - Signing tls key in pem format
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    sign(key: string, gasLimit?: number): Promise<void>;
    /**
     * Updates certs stored on chain
     * @dev Do not store root certificates, they are passed to the resolver
     * @param {string[]} certs - TLS certificates in pem format up to but not including the root certificate
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    addChain(certs: string[], gasLimit?: number): Promise<void>;
    /**
     * Deletes TLS-DID by resetting the reference to the block containing the last change to 0
     * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
     */
    delete(gasLimit?: number): Promise<void>;
}
