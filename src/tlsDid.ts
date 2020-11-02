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
import { sign } from './utils';

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xf5513bc073A86394a0Fa26F11318D5D30AeAf550';

export class TLSDID {
  private pemPrivateKey: string;
  private provider: providers.JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;
  domain: string;
  attributes: IAttribute[] = [];
  expiry: Date;
  signature: string;

  constructor(
    pemPrivateKey: string,
    ethereumPrivateKey: string,
    provider: providers.JsonRpcProvider
  ) {
    this.pemPrivateKey = pemPrivateKey;
    this.provider = provider;
    this.wallet = new Wallet(ethereumPrivateKey, provider);
  }

  async connectToContract(address: string): Promise<void> {
    //Create contract object and connect to contract
    const contract = new Contract(address, TLSDIDJson.abi, this.provider);
    this.contract = contract.connect(this.wallet);

    //Retrive domain from contract
    this.domain = await contract.domain();

    //Retrive expiry from contract
    let expiryBN: BigNumber;
    expiryBN = await contract.expiry();
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

  async deployContract(): Promise<void> {
    const factory = new ContractFactory(
      TLSDIDJson.abi,
      TLSDIDJson.bytecode,
      this.wallet
    );
    this.contract = await factory.deploy();
    await this.contract.deployed();
  }

  async registerContract(domain: string): Promise<void> {
    if (domain?.length === 0) {
      throw new Error('No domain provided');
    }
    await this.setDomain(domain);
    await this.signContract();

    //Create registry contract object and connect to contract
    const registry = new Contract(
      REGISTRY,
      TLSDIDRegistryJson.abi,
      this.provider
    );
    const registryWithSigner = registry.connect(this.wallet);

    //Register tls did contract address on registry
    const tx = await registryWithSigner.registerContract(
      domain,
      this.contract.address
    );
    const receipt = await tx.wait();
    if (receipt.status === 0) {
      throw 'registerContract unsuccesfull';
    }
  }

  private async setDomain(domain: string): Promise<void> {
    const tx = await this.contract.setDomain(domain);
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.domain = domain;
    } else {
      throw 'setDomain unsuccesfull';
    }
  }

  async addAttribute(path: string, value: string): Promise<void> {
    const tx = await this.contract.addAttribute(path, value);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.attributes.push({ path, value });
      await this.signContract();
    } else {
      throw 'setAttribute unsuccesfull';
    }
  }

  async setExpiry(date: Date): Promise<void> {
    const expiry = date.getTime();
    const tx = await this.contract.setExpiry(expiry);
    await tx.wait();
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      this.expiry = date;
      await this.signContract();
    } else {
      throw 'setExpiry unsuccesfull';
    }
  }

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
      throw 'setSignature unsuccesfull';
    }
  }

  getAddress(): string {
    if (!this.contract) {
      throw 'contract not setup';
    }
    return this.contract.address;
  }
}
