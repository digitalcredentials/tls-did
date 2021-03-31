import { Wallet, Contract, Event, providers, EventFilter, BigNumber } from 'ethers';
import { hexZeroPad } from 'ethers/lib/utils';
import TLSDIDRegistry from '@digitalcredentials/tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { REGISTRY, NetworkConfig, Attribute } from '@digitalcredentials/tls-did-utils';
import { chainToCerts } from './utils';
import { sign, hashContract, configureProvider } from '@digitalcredentials/tls-did-utils';

export class TLSDID {
  private provider: providers.Provider;
  private wallet: Wallet;
  private registry: Contract;
  registered: boolean;
  domain: string;
  attributes: Attribute[] = [];
  expiry: Date;
  signature: string;
  chain: string[];

  /**
   * Initializes TLS-DID object
   * @param {string} ethereumPrivateKey - ethereum private key with enough funds to pay for transactions
   * @param {string} [registry] - ethereum address of TLS-DID Registry
   * @param {IProviderConfig} providerConfig - config for ethereum provider {}
   */
  constructor(domain, ethereumPrivateKey: string, networkConfig: NetworkConfig = {}) {
    if (domain?.length === 0) {
      throw new Error('No domain provided');
    }
    if (ethereumPrivateKey?.length === 0) {
      throw new Error('No ethereum private key provided');
    }

    this.domain = domain;
    this.provider = configureProvider(networkConfig.providerConfig);
    this.wallet = new Wallet(ethereumPrivateKey, this.provider);

    //Create registry contract object and connect wallet
    const registry = new Contract(
      networkConfig.registry ? networkConfig.registry : REGISTRY,
      TLSDIDRegistry.abi,
      this.provider
    );
    this.registry = registry.connect(this.wallet);
  }

  /**
   * Read data previously stored on chain for ethereum account and TLS-DID identifier (domain) combination
   */
  public async loadDataFromRegistry() {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    //Read registration state from chain
    await this.getOwnership();
    if (!this.registered) {
      //No did was registered with the domain ethereum address combination
      return;
    }

    //Read index of block containing last change event from chain
    const lastChangeBlockBN = await this.registry.changeRegistry(this.wallet.address, this.domain);
    const lastChangeBlock = lastChangeBlockBN.toNumber();
    if (lastChangeBlock === 0) {
      //No previous changes found for this domain
      return;
    }

    //Setup filters for events associated with TLS-DID
    let filters = [
      this.registry.filters.ExpiryChanged(),
      this.registry.filters.SignatureChanged(),
      this.registry.filters.AttributeChanged(),
      this.registry.filters.ChainChanged(),
    ];
    //Add ethereum account to event filters
    filters.forEach((filter) => filter.topics.push(hexZeroPad(this.wallet.address, 32)));

    //Query chain with filters starting at the block containing the last change
    await this.queryChain(filters, lastChangeBlock);
  }

  /**
   * Query chain with a set of event filters
   * @param {EventFilter[]} filters - Filters by which to query the chain
   * @param {number} block - Block on which the query is started
   */
  private async queryChain(filters: EventFilter[], block: number): Promise<void> {
    //TODO This could be more efficient, the ethers library only correctly decodes events if event type is present in event filter
    //The block with the last change is search for all types of changed events
    let events = await this.queryBlock(filters, block);
    if (events.length === 0) {
      throw new Error(`No event found in block: ${block}`);
    }

    //Sort events by most recent to most dated
    events.sort((a, b) => b.args.previousChange - a.args.previousChange);

    //The data contained is added to the internal state depending on change type
    events.forEach((event) => {
      switch (true) {
        //All attributes are stored
        case event.event == 'AttributeChanged':
          const path = event.args.path;
          const value = event.args.value;
          this.attributes.push({ path, value });
          break;
        //The most recent expiry change is stored
        case event.event == 'ExpiryChanged' && this.expiry == null:
          const expiry = event.args.expiry.toNumber();
          this.expiry = new Date(expiry);
          break;
        //The most recent signature change is stored
        case event.event == 'SignatureChanged' && this.signature == null:
          this.signature = event.args.signature;
          break;
        //The most recent chain change is stored
        case event.event == 'ChainChanged' && this.chain == null:
          this.chain = chainToCerts(event.args.chain);
          break;
      }
    });

    // TODO is the event array sorted by creation time
    // The next change block is read from last event in the chain of events from the current block
    // If the next change block is equal to 0 no older change events exist
    const previousChangeBlockBN = events[events.length - 1].args.previousChange;
    const previousChangeBlock = previousChangeBlockBN.toNumber();
    if (previousChangeBlock > 0) {
      await this.queryChain(filters, previousChangeBlock);
    }
  }

  /**
   * Reads registration state from chain
   */
  private async getOwnership() {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    //Reads the count of claimants (ethereum accounts) of the TLS-DID identifier (domain) from chain
    const claimantsCountBN: BigNumber = await this.registry.getClaimantsCount(this.domain);
    const claimantsCount = claimantsCountBN.toNumber();

    //Reads the array of claimants from chain
    const claimants = await Promise.all(
      Array.from(Array(claimantsCount).keys()).map((i) => this.registry.claimantsRegistry(this.domain, i))
    );
    //Checks if the internal ethereum account is contained in the set of claimants
    this.registered = claimants.includes(this.wallet.address);
  }

  /**
   * Query block with a set of event filters
   * @param {EventFilter[]} filters - Filters by which to query the block
   * @param {number} block - Number of block to query
   */
  private async queryBlock(filters: EventFilter[], block: number): Promise<Event[]> {
    //Generates a ethers queryFilter function call from the set of event filters
    //Waits for all responses from the queryFilter calls
    //Flattens the returns from the queryFilter calls to an array
    let events = (await Promise.all(filters.map((filter) => this.registry.queryFilter(filter, block, block)))).flat();
    return events;
  }

  /**
   * Adds ethereum account to claimants of TLS-DID identifier (domain)
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async register(gasLimit?: number): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.registerOwnership(this.domain, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.registered = true;
    } else {
      throw new Error('registration unsuccessful');
    }
  }

  /**
   * Adds attribute to TLS-DID Document stored on chain
   * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
   * @param {string} value - Value stored in path
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async addAttribute(path: string, value: string, gasLimit?: number): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.addAttribute(this.domain, path, value, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.attributes.push({ path, value });
    } else {
      throw new Error('setAttribute unsuccessful');
    }
  }

  /**
   * Updates expiry of TLS-DID on chain
   * @param {Date} date - Expiry date
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async setExpiry(date: Date, gasLimit?: number): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    const expiry = date.getTime();

    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.setExpiry(this.domain, expiry, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.expiry = date;
    } else {
      throw new Error('setExpiry unsuccessful');
    }
  }

  /**
   * Updates signature stored on chain
   * @param {string} key - Signing tls key in pem format
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async sign(key: string, gasLimit?: number): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    //Hash contract and sign hash with pem private key
    const hash = hashContract(this.domain, this.attributes, this.expiry, this.chain);
    const signature = sign(key, hash);

    //Update contract with new signature
    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.setSignature(this.domain, signature, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.signature = signature;
    } else {
      throw new Error('setSignature unsuccessful');
    }
  }

  /**
   * Updates certs stored on chain
   * @dev Do not store root certificates, they are passed to the resolver
   * @param {string[]} certs - TLS certificates in pem format up to but not including the root certificate
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async addChain(certs: string[], gasLimit?: number) {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    const joinedCerts = certs.join('\n');

    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.addChain(this.domain, joinedCerts, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.chain = certs;
    } else {
      throw new Error(`addChain unsuccessful`);
    }
  }

  /**
   * Deletes TLS-DID by resetting the reference to the block containing the last change to 0
   * @param {number} [gasLimit] - Optional gasLimit for the ethereum transaction
   */
  async delete(gasLimit?: number) {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    const options: { gasLimit?: number } = { gasLimit };
    const tx = await this.registry.remove(this.domain, options);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.attributes = [];
      this.expiry = null;
      this.signature = null;
      this.chain = [];
    } else {
      throw new Error(`delete unsuccessful`);
    }
  }
}
