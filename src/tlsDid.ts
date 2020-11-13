import {
  Wallet,
  Contract,
  ContractFactory,
  providers,
  BigNumber,
} from 'ethers';
import { hashContract } from 'tls-did-resolver';
import TLSDIDJson from 'tls-did-registry/build/contracts/TLSDID.json';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { ProviderConfig, Attribute } from './types';
import { sign } from './utils';

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xA725A297b0F81c502df772DBE2D0AEb68788679b';

function configureProvider(conf: ProviderConfig = {}): providers.Provider {
  if (conf.provider) {
    return conf.provider;
  }
  if (conf.rpcUrl) {
    return new providers.JsonRpcProvider(conf.rpcUrl);
  }
  if (conf.web3) {
    return new providers.Web3Provider(conf.web3.currentProvider);
  }
}

export class TLSDID {
  private registry: string;
  private pemPrivateKey: string;
  private provider: providers.Provider;
  private wallet: Wallet;
  private contract: Contract;
  domain: string;
  attributes: Attribute[] = [];
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
  constructor(
    pemPrivateKey: string,
    ethereumPrivateKey: string,
    registry: string = REGISTRY,
    providerConfig: ProviderConfig
  ) {
    this.registry = registry;
    this.pemPrivateKey = pemPrivateKey;
    this.provider = configureProvider(providerConfig);
    this.wallet = new Wallet(ethereumPrivateKey, this.provider);
  }

  /**
   * Connects to existing TLS DID contract
   * @param {string} address - ethereum address of existing TLS DID Contract
   */
  async connectToContract(address: string): Promise<void> {
    //Create contract object and connect to contract
    const contract = new Contract(address, TLSDIDJson.abi, this.provider);
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
  }

  /**
   * Deploys TLS DID Contract
   */
  async deployContract(): Promise<void> {
    const factory = new ContractFactory(
      TLSDIDJson.abi,
      TLSDIDJson.bytecode,
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
      TLSDIDRegistryJson.abi,
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
   * @param {string} path - Path of value, format 'parent/child'
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
}
