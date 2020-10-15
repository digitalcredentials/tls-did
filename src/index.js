import crypto from 'crypto';
import { ethers } from 'ethers';
import TLSDIDJson from 'tls-did-registry/build/contracts/TLSDID.json';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0x651a4efe8221447261ed8a6fe8a75D971C94f79c';

function hashContract(domain, address, attributes, expiry) {
  //TODO implement if values are empty/undefined => ""
  //TODO test use buffer?
  const stringified = domain + address + attributes + expiry;
  const hasher = crypto.createHash('sha256');
  hasher.update(stringified);
  const hash = hasher.digest('hex');
  return hash;
}

function sign(pemKey, data) {
  const signer = crypto.createSign('sha256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(pemKey).toString('base64');
  return signature;
}

export default class TLSDID {
  constructor(pemPrivateKey, ethereumPrivateKey, provider) {
    this.pemPrivateKey = pemPrivateKey;
    this.ethereumPrivateKey = ethereumPrivateKey;
    this.provider = provider;
    this.wallet = new ethers.Wallet(ethereumPrivateKey, provider);
  }

  async connectToContract(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      TLSDIDJson.abi,
      this.provider
    );
    this.contract = contract.connect(this.wallet);
    this.domain = await contract.domain();
    this.expiry = await contract.expiry();
    this.attributes = await contract.getAttributes();
    this.signature = await contract.signature();
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
    this.domain = domain;
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
    this.signature = signature;
  }

  addAttribute() {}
}
