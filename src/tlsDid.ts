import { Wallet, Contract, Event, providers, EventFilter, BigNumber } from 'ethers';
import { hexZeroPad } from 'ethers/lib/utils';
import TLSDIDRegistry from '@digitalcredentials/tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { REGISTRY, NetworkConfig, Attribute } from '@digitalcredentials/tls-did-utils';
import { configureProvider, chainToCerts } from './utils';
import { sign, hashContract } from '@digitalcredentials/tls-did-utils';

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
   * //TODO Allow for general provider type, see ethr-did implementation
   * Creates an instance of tlsdid.
   * @param {string} ethereumPrivateKey - ethereum private key with enough
   * funds to pay for transactions
   * @param {string} [registry] - ethereum address of TLS DID Contract Registry
   * @param {IProviderConfig} providerConfig - config for ethereum provider {}
   */
  constructor(domain, ethereumPrivateKey: string, networkConfig: NetworkConfig = {}) {
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

  public async loadDataFromRegistry() {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    await this.getOwnership();
    if (!this.registered) {
      //No did was registered with the domain ethereum address combination
      return;
    }

    const lastChangeBlockBN = await this.registry.changeRegistry(this.wallet.address, this.domain);
    const lastChangeBlock = lastChangeBlockBN.toNumber();
    if (lastChangeBlock === 0) {
      //No previous changes found for this domain
      return;
    }

    let filters = [
      this.registry.filters.ExpiryChanged(),
      this.registry.filters.SignatureChanged(),
      this.registry.filters.AttributeChanged(),
      this.registry.filters.ChainChanged(),
    ];
    filters.forEach((filter) => filter.topics.push(hexZeroPad(this.wallet.address, 32)));

    await this.queryChain(filters, lastChangeBlock);
  }

  private async queryChain(filters: EventFilter[], block: number): Promise<void> {
    //TODO This could be more efficient, the ethers library only correctly decodes events if event type is present in event filter
    //The block with the last change is search for all types of changed events
    let events = await this.queryBlock(filters, block);
    if (events.length === 0) {
      throw new Error(`No event found in block: ${block}`);
    }

    events.forEach((event) => {
      switch (true) {
        case event.event == 'AttributeChanged':
          const path = event.args.path;
          const value = event.args.value;
          this.attributes.push({ path, value });
          break;

        case event.event == 'ExpiryChanged' && this.expiry == null:
          const expiry = event.args.expiry.toNumber();
          this.expiry = new Date(expiry);
          break;

        case event.event == 'SignatureChanged' && this.signature == null:
          this.signature = event.args.signature;
          break;

        case event.event == 'ChainChanged' && this.chain == null:
          this.chain = chainToCerts(event.args.chain);
          break;
      }
    });

    // TODO is the event array sorted by creation time
    const previousChangeBlockBN = events[events.length - 1].args.previousChange;
    const previousChangeBlock = previousChangeBlockBN.toNumber();
    if (previousChangeBlock > 0) {
      await this.queryChain(filters, previousChangeBlock);
    }
  }

  private async getOwnership() {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    const claimantsCountBN: BigNumber = await this.registry.getClaimantsCount(this.domain);
    const claimantsCount = claimantsCountBN.toNumber();

    const claimants = await Promise.all(
      Array.from(Array(claimantsCount).keys()).map((i) => this.registry.claimantsRegistry(this.domain, i))
    );
    this.registered = claimants.includes(this.wallet.address);
  }

  private async queryBlock(filters: EventFilter[], block: number): Promise<Event[]> {
    let events = (await Promise.all(filters.map((filter) => this.registry.queryFilter(filter, block, block)))).flat();
    return events;
  }

  /**
   * Registers account to claimants of DID identifier( domain)
   */
  private async register(): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    const tx = await this.registry.registerOwnership(this.domain);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.registered = true;
    } else {
      throw new Error('registration unsuccessful');
    }
  }

  /**
   * Adds attribute to DID Document
   * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
   * @param {string} value - Value stored in path
   * @param {string} key - Signing tls key in pem format
   */
  async addAttribute(path: string, value: string, key: string): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    if (!this.registered) {
      await this.register();
    }
    try {
      const tx = await this.registry.addAttribute(this.domain, path, value);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.attributes.push({ path, value });
        await this.signContract(key);
      } else {
        throw new Error('setAttribute unsuccessful');
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Sets expiry of TLS DID Contract
   * @param {Date} date - Expiry date
   * @param {string} key - Signing tls key in pem format
   */
  async setExpiry(date: Date, key: string): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    if (!this.registered) {
      await this.register();
    }
    const expiry = date.getTime();
    const tx = await this.registry.setExpiry(this.domain, expiry);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.expiry = date;
      await this.signContract(key);
    } else {
      throw new Error('setExpiry unsuccessful');
    }
  }

  /**
   * Signs the TLS DID Contract
   * @param {string} key - Signing tls key in pem format
   */
  private async signContract(key: string): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    if (!this.registered) {
      await this.register();
    }

    //Hash contract and sign hash with pem private key
    const hash = hashContract(this.domain, this.attributes, this.expiry, [this.chain]);
    const signature = sign(key, hash);

    //Update contract with new signature
    const tx = await this.registry.setSignature(this.domain, signature);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.signature = signature;
    } else {
      throw new Error('setSignature unsuccessful');
    }
  }

  /**
   * Stores certs in the TLS DID Certificate Contract
   * @dev Do not store root certificates, they are passed to the resolver
   * @todo What to do when cert expire / are invalid
   * @param certs
   * @param {string} key - Signing tls key in pem format
   */
  async addChain(certs: string[], key: string) {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    if (!this.registered) {
      await this.register();
    }
    const joinedCerts = certs.join('\n');
    const tx = await this.registry.addChain(this.domain, joinedCerts);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.chain = certs;
      await this.signContract(key);
    } else {
      throw new Error(`addChain unsuccessful`);
    }
  }

  /**
   * Stores certs in the TLS DID Certificate Contract
   * @dev Do not store root certificates, they are passed to the resolver
   * @todo What to do when cert expire / are invalid
   * @param certs
   * @param {string} key - Signing tls key in pem format
   */
  async delete() {
    const tx = await this.registry.remove(this.registry);
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
