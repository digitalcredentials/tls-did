import crypto from 'crypto';
import { ethers } from 'ethers';
import { hashContract } from 'tls-did-resolver';
import TLSDIDJson from 'tls-did-registry/build/contracts/TLSDID.json';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xe28131a74c9Fb412f0e57AD4614dB1A8D6a01793';

function sign(pemKey, data) {
  const signer = crypto.createSign('sha256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(pemKey).toString('base64');
  return signature;
}

export default class TLSDID {
  attributes = [];
  constructor(pemPrivateKey, ethereumPrivateKey, provider) {
    this.pemPrivateKey = pemPrivateKey;
    this.ethereumPrivateKey = ethereumPrivateKey;
    this.provider = provider;
    this.wallet = new ethers.Wallet(ethereumPrivateKey, provider);
  }

  async connectToContract(address) {
    const contract = new ethers.Contract(
      address,
      TLSDIDJson.abi,
      this.provider
    );
    this.contract = contract.connect(this.wallet);
    this.domain = await contract.domain();
    this.expiry = await contract.expiry();
    const attributeCount = await contract.getAttributeCount();
    let attributes = [];
    for (let i = 0; i < attributeCount; i++) {
      const attribute = await contract.getAttribute(i);
      const path = attribute['0'];
      const value = attribute['1'];
      attributes.push({ path, value });
    }
    this.attributes = attributes;
    this.signature = await contract.signature();
    return this.attributes;
  }

  async deployContract() {
    const factory = new ethers.ContractFactory(
      TLSDIDJson.abi,
      TLSDIDJson.bytecode,
      this.wallet
    );
    this.contract = await factory.deploy();
    await this.contract.deployed();
  }

  async registerContract(domain) {
    if (domain?.length === 0) {
      throw new Error('No domain provided');
    }
    const tx1 = await this.contract.setDomain(domain);
    await tx1.wait();
    //TODO if successful
    this.domain = domain;
    await this.signContract();
    const did = `did:tls:${this.domain}`;

    const registry = new ethers.Contract(
      REGISTRY,
      TLSDIDRegistryJson.abi,
      this.provider
    );
    const registryWithSigner = registry.connect(this.wallet);

    const tx2 = await registryWithSigner.registerContract(
      did,
      this.contract.address
    );
    await tx2.wait();
  }

  async signContract() {
    if (this.domain?.length === 0) {
      throw new Error('No domain provided');
    }
    const hash = hashContract(
      this.domain,
      this.contract.address,
      this.attributes,
      this.expiry
    );
    const signature = sign(this.pemPrivateKey, hash);
    const tx = await this.contract.setSignature(signature);
    await tx.wait();
    //TODO if successful
    this.signature = signature;
  }

  async addAttribute(path, value) {
    const tx = await this.contract.addAttribute(path, value);
    await tx.wait();
    //TODO if successful
    this.attributes.push({ path, value });
    await this.signContract();
  }
}
