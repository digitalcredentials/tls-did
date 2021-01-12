import {
  Wallet,
  Contract,
  ContractFactory,
  providers,
  BigNumber,
} from 'ethers';
import { hashContract } from 'tls-did-resolver';
import TLSDIDContract from 'tls-did-registry/build/contracts/TLSDID.json';
import TLSDIDRegistryContract from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { NetworkConfig, Attribute } from './types';
import { sign, configureProvider, chainToCerts } from './utils';

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xaF9BA0dFa7D79eA2d1cFD28996dEf081c29dA51e';

export class TLSDID {
  private registry: string;
  private provider: providers.Provider;
  private wallet: Wallet;
  private contract: Contract;
  domain: string;
  attributes: Attribute[] = [];
  expiry: Date;
  signature: string;
  chains: string[][] = [];

  /**
   * //TODO Allow for general provider type, see ethr-did implementation
   * Creates an instance of tlsdid.
   * @param {string} ethereumPrivateKey - ethereum private key with enougth
   * funds to pay for transactions
   * @param {string} [registry] - ethereum address of TLS DID Contract Registry
   * @param {IProviderConfig} providerConfig - config for ethereum provider {}
   */
  constructor(ethereumPrivateKey: string, networkConfig: NetworkConfig = {}) {
    this.registry = networkConfig.registry ? networkConfig.registry : REGISTRY;
    this.provider = configureProvider(networkConfig.providerConfig);
    this.wallet = new Wallet(ethereumPrivateKey, this.provider);
  }

  /**
   * Connects to existing TLS DID contract
   * @param {string} address - ethereum address of existing TLS DID Contract
   */
  async connectToContract(address: string): Promise<void> {
    //Create contract object and connect to contract
    const contract = new Contract(address, TLSDIDContract.abi, this.provider);
    this.contract = contract.connect(this.wallet);

    await Promise.all([
      this.getDomain(),
      this.getExpiry(),
      this.getAttributes(),
      this.getChains(),
      this.getSignature(),
    ]);
  }

  private async getDomain() {
    this.domain = await this.contract.domain();
  }

  private async getExpiry() {
    const expiryBN: BigNumber = await this.contract.expiry();
    this.expiry = new Date(expiryBN.toNumber());
  }

  private async getAttributes() {
    const attributeCountBN = await this.contract.getAttributeCount();
    const attributeCount = attributeCountBN.toNumber();

    //Creates and waits for an array of promisses each containing an getAttribute call
    const attributes = await Promise.all(
      Array.from(Array(attributeCount).keys()).map((i) =>
        this.contract.getAttribute(i)
      )
    );

    //Transforms array representation of attributes to object representation
    attributes.forEach((attribute) => {
      const path = attribute['0'];
      const value = attribute['1'];
      this.attributes.push({ path, value });
    });
  }

  private async getChains() {
    const chainCountBN = await this.contract.getChainCount();
    const chainCount = chainCountBN.toNumber();

    //Creates and waits for an array of promisses each containing an getChain call
    const chains = await Promise.all(
      Array.from(Array(chainCount).keys()).map((i) => this.contract.getChain(i))
    );

    //Splits concatenated cert string to array of certs
    this.chains = chains.map((chain) => chainToCerts(chain));
  }

  private async getSignature() {
    this.signature = await this.contract.signature();
  }

  /**
   * Deploys TLS DID Contract
   */
  async deployContract(): Promise<void> {
    const factory = new ContractFactory(
      TLSDIDContract.abi,
      TLSDIDContract.bytecode,
      this.wallet
    );
    this.contract = await factory.deploy();
    await this.contract.deployed();
  }

  /**
   * Registers TLS DID Contract with TLS DID Registry
   * @param {string} domain - tls:did:<domain>
   * @param {string} key - Signing tls key in pem format
   */
  async registerContract(domain: string, key: string): Promise<void> {
    if (domain?.length === 0) {
      throw new Error('No domain provided');
    }
    await this.setDomain(domain);
    await this.signContract(key);

    //Create registry contract object and connect to contract
    const registry = new Contract(
      this.registry,
      TLSDIDRegistryContract.abi,
      this.provider
    );
    const registryWithSigner = registry.connect(this.wallet);

    //Register TLS DID Contract address on registry
    const tx = await registryWithSigner.registerContract(
      domain,
      this.contract.address
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw new Error('registerContract unsuccesfull');
    }
  }

  /**
   * Sets domain
   * @param {string} domain - tls:did:<domain>
   */
  private async setDomain(domain: string): Promise<void> {
    const tx = await this.contract.setDomain(domain);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.domain = domain;
    } else {
      throw new Error('setDomain unsuccesfull');
    }
  }

  /**
   * Adds attribute to DID Document
   * @param {string} path - Path of value, format 'parent/child' or 'parent[]/child'
   * @param {string} value - Value stored in path
   * @param {string} key - Signing tls key in pem format
   */
  async addAttribute(path: string, value: string, key: string): Promise<void> {
    const tx = await this.contract.addAttribute(path, value);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.attributes.push({ path, value });
      await this.signContract(key);
    } else {
      throw new Error('setAttribute unsuccesfull');
    }
  }

  /**
   * Sets expiry of TLS DID Contract
   * @param {Date} date - Expiry date
   * @param {string} key - Signing tls key in pem format
   */
  async setExpiry(date: Date, key: string): Promise<void> {
    const expiry = date.getTime();
    const tx = await this.contract.setExpiry(expiry);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.expiry = date;
      await this.signContract(key);
    } else {
      throw new Error('setExpiry unsuccesfull');
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

    //Hash contract and sign hash with pem private key
    const hash = hashContract(
      this.domain,
      this.contract.address,
      this.attributes,
      this.expiry,
      this.chains
    );
    const signature = sign(key, hash);

    //Update contract with new signature
    const tx = await this.contract.setSignature(signature);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.signature = signature;
    } else {
      throw new Error('setSignature unsuccesfull');
    }
  }

  /**
   * Gets address
   * @returns {string} address
   */
  getAddress(): string {
    if (!this.contract) {
      throw new Error('No linked ethereum contract available');
    }
    return this.contract.address;
  }

  /**
   * Stores certs in the TLS DID Certificate Contract
   * @dev Do not store root certificates, they are passed to the resolver
   * @todo What to do when cert expire / are invalid
   * @param certs
   * @param {string} key - Signing tls key in pem format
   */
  async addChain(certs: string[], key: string) {
    const joinedCerts = certs.join('\n');
    const tx = await this.contract.addChain(joinedCerts);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.chains.push(certs);
      await this.signContract(key);
    } else {
      throw new Error(`addChain unsuccesfull`);
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
    const tx = await this.contract.remove(this.registry);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.contract = null;
      this.domain = null;
      this.attributes = [];
      this.expiry = null;
      this.signature = null;
      this.chains = [];
    } else {
      throw new Error(`delete unsuccesfull`);
    }
  }
}
