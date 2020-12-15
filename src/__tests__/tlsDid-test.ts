import { Contract, providers, BigNumber } from 'ethers';
import { readFileSync } from 'fs';
import TLSDIDRegistryContract from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { TLSDID } from '../index';
import c from './testConfig.json';

//TODO verify signatures after value updates
//TODO import registry address from tls-did-registry or tls-did-resolver

let pemKey: string;
let tlsDid: TLSDID;
let address: string;

describe('TLSDID instantiation', () => {
  beforeAll(() => {
    pemKey = readFileSync(__dirname + c.privKeyPath, 'utf8');
  });

  it('should instantiate TLSDID without provider and registry addresses', () => {
    let tlsDid = new TLSDID(c.etherPrivKey);
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should instantiate TLSDID with rpcUrl', () => {
    let tlsDid = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should instantiate TLSDID with ethers provider', () => {
    let tlsDid = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        provider: new providers.JsonRpcProvider(c.jsonRpcUrl),
      },
    });
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });
});

describe('TLSDID', () => {
  beforeAll(() => {
    pemKey = readFileSync(__dirname + c.privKeyPath, 'utf8');
    tlsDid = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
  });

  it('should deploy new TLSDID contract', async () => {
    await tlsDid.deployContract();

    //Assert that contract has an address with the correct length
    address = tlsDid.getAddress();
    expect(address.length).toBe(42);
  });

  it('should connect to TLSDID contract', async () => {
    const tlsDidDuplicate = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });

    //Assert that connecting to existing TLSDID Contract does not throw error
    expect(
      async () => await tlsDidDuplicate.connectToContract(address)
    ).not.toThrow();

    //Assert that connected TLSDID Contract has correct address
    expect(tlsDidDuplicate.getAddress()).toEqual(address);
  });

  it('should register TLSDID contract', async () => {
    const domain = 'example.org';
    await tlsDid.registerContract(domain, pemKey);

    //Assert that DID to contract mapping is stored in registry
    const registry = new Contract(
      c.registryAddress,
      TLSDIDRegistryContract.abi,
      new providers.JsonRpcProvider(c.jsonRpcUrl)
    );
    const addresses = await registry.getContracts(domain);
    expect(addresses.includes(tlsDid.getAddress())).toBeTruthy();

    //Assert that domain is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.connectToContract(address);
    expect(tlsDidDuplicate.domain).toBe(domain);
  });

  it('should add attribute to TLSDID contract', async () => {
    await tlsDid.addAttribute('parent/child', 'value', pemKey);

    //Assert that the new attribute is stored in the TLSDID object
    const includedO = tlsDid.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedO).toBeTruthy();

    //Assert that the new attribute is stored in the TLSDID contract
    const tlsDidDuplicate = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    const test = await tlsDidDuplicate.connectToContract(address);
    const includedC = tlsDidDuplicate.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedC).toBeTruthy();
  });

  it('should add expiry to TLSDID contract', async () => {
    const expiry = new Date('12 / 12 / 2040');
    await tlsDid.setExpiry(expiry, pemKey);

    //Assert that expiry is updated in TLSDID object
    expect(tlsDid.expiry).toBe(expiry);

    //Assert that expiry is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.connectToContract(address);
    expect(tlsDidDuplicate.expiry).toStrictEqual(expiry);
  });

  it('should register chain', async () => {
    //Register new chain
    const chain = [
      '-----BEGIN CERTIFICATE-----\nCertA\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nCertB\n-----END CERTIFICATE-----',
    ];
    await tlsDid.registerChain(chain, pemKey);

    //Assert that expiry is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });

    await tlsDidDuplicate.connectToContract(address);
    expect(tlsDidDuplicate.chains[tlsDidDuplicate.chains.length - 1]).toEqual(
      chain
    );
  });
});
