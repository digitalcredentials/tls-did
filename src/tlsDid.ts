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
import TLSDIDCertRegistryContract from 'tls-did-registry/build/contracts/TLSDIDCertRegistry.json';
import { NetworkConfig, Attribute } from './types';
import { sign, configureProvider, chainToCerts } from './utils';

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xaF9BA0dFa7D79eA2d1cFD28996dEf081c29dA51e';
const CERT_REGISTRY = '0x4d7648dE110574047EEa4F525Fd7FD10c318018e';

export class TLSDID {
  private registry: string;
  private certRegistry: string;
  private pemPrivateKey: string;
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
   * @param {string} pemPrivateKey - TLS private key
   * @param {string} ethereumPrivateKey - ethereum private key with enougth
   * funds to pay for transactions
   * @param {string} [registry] - ethereum address of TLS DID Contract Registry
   * @param {IProviderConfig} providerConfig - config for ethereum provider {}
   */
  constructor(
    pemPrivateKey: string,
    ethereumPrivateKey: string,
    networkConfig: NetworkConfig = {}
  ) {
    this.registry = networkConfig.registry ? networkConfig.registry : REGISTRY;
    this.certRegistry = networkConfig.certRegistry
      ? networkConfig.certRegistry
      : CERT_REGISTRY;
    this.pemPrivateKey = pemPrivateKey;
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

    //Retrive domain from contract
    this.domain = await contract.domain();

    //Retrive expiry from contract
    const expiryBN: BigNumber = await contract.expiry();
    this.expiry = new Date(expiryBN.toNumber());
    const attributeCount = await contract.getAttributeCount();

    //Retrive all attributes from the contract
    for (let i = 0; i < attributeCount; i++) {
      const attribute = await contract.getAttribute(i);
      const path = attribute['0'];
      const value = attribute['1'];
      this.attributes.push({ path, value });
    }

    //Retrive signature from the contract
    this.signature = await contract.signature();

    //Retrive registered certs
    const certRegistry = new Contract(
      this.certRegistry,
      TLSDIDCertRegistryContract.abi,
      this.provider
    );
    const chainCount = await certRegistry.getChainCount(this.domain);

    this.chains = [];
    for (let i = 0; i < chainCount; i++) {
      const chain = await certRegistry.getChain(this.domain, i);
      const certs = chainToCerts(chain);
      this.chains.push(certs);
    }
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
   */
  async registerContract(domain: string): Promise<void> {
    if (domain?.length === 0) {
      throw new Error('No domain provided');
    }
    await this.setDomain(domain);
    await this.signContract();

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
   */
  async addAttribute(path: string, value: string): Promise<void> {
    const tx = await this.contract.addAttribute(path, value);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.attributes.push({ path, value });
      await this.signContract();
    } else {
      throw new Error('setAttribute unsuccesfull');
    }
  }

  /**
   * Sets expiry of TLS DID Contract
   * @param {Date} date - Expiry date
   */
  async setExpiry(date: Date): Promise<void> {
    const expiry = date.getTime();
    const tx = await this.contract.setExpiry(expiry);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.expiry = date;
      await this.signContract();
    } else {
      throw new Error('setExpiry unsuccesfull');
    }
  }

  /**
   * Signs the TLS DID Contract
   */
  private async signContract(): Promise<void> {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }

    //Hash contract and sign hash with pem private key
    const hash = hashContract(
      this.domain,
      this.contract.address,
      this.attributes,
      this.expiry
    );
    const signature = sign(this.pemPrivateKey, hash);

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
   * @dev Relies on domain stored in this.domain when calling registerContract
   * Do not store root certificate, it is read from node
   * @param certs
   */
  async registerChain(certs: string[]) {
    if (!this.domain) {
      throw new Error('No domain available, register contract first');
    }
    // TODO global address
    // What to do when cert expire / are invalid
    const certRegistry = new Contract(
      this.certRegistry,
      TLSDIDCertRegistryContract.abi,
      this.provider
    );
    const certRegistryWithSigner = certRegistry.connect(this.wallet);

    const joinedCerts = certs.join('\n');
    const tx = await certRegistryWithSigner.addChain(this.domain, joinedCerts);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.chains.push(certs);
    } else {
      throw new Error(`addChain unsuccesfull`);
    }
  }
}
