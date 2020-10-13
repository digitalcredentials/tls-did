import { ethers } from 'ethers';
import TLSDIDJson from 'tls-did-registry/build/contracts/TLSDID.json';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
//TODO how do we access the contracts bytcode needed for deployment
//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0x7778280c8de2c1650fc0BEC6Dd40EA68D026ABED';

export default class TLSDID {
  constructor(pemPath, ethereumPrivateKey, provider) {
    this.pemPath = pemPath;
    this.ethereumPrivateKey = ethereumPrivateKey;
    this.provider = provider;
    this.wallet = new ethers.Wallet(ethereumPrivateKey, provider);
  }

  connectToContract(contractAddress) {
    const contract = new ethers.Contract(
      contractAddress,
      TLSDIDJson.abi,
      this.provider
    );
    this.contract = contract.connect(this.wallet);
  }

  async deloySmartContract() {
    const factory = new ethers.ContractFactory(
      TLSDIDJson.abi,
      TLSDIDJson.bytecode,
      this.wallet
    );
    this.contract = await factory.deploy();
    await this.contract.deployed();
    await this.signSmartContract();
  }

  async registerSmartContract(domain) {
    const registry = new ethers.Contract(
      REGISTRY,
      TLSDIDRegistryJson.abi,
      this.provider
    );
    const registryWithSigner = registry.connect(this.wallet);
    const did = `did:tls:${domain}`;
    const tx = await registryWithSigner.registerContract(
      did,
      this.contract.address
    );
    await tx.wait();
  }

  async signSmartContract() {}

  addAttribute() {}
}
