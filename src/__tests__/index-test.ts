import { Contract, providers } from 'ethers';
import { readFileSync } from 'fs';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
import TLSDID from '../index';

//TODO verify signatures after value updates

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xf5513bc073A86394a0Fa26F11318D5D30AeAf550';

//Tested with ganache
const jsonRpcUrl = 'http://localhost:8545';
const etherPrivateKey =
  '0x0c8409af9c479d1af65ccfc4f7ecc1fcc219ea0f42dc3351ef9181b0ae28bcd1';
const pemPath = '/ssl/private/testserver.pem';

let provider: providers.JsonRpcProvider;
let pemKey: string;
let tlsDid: TLSDID;
let address: string;

describe('TLSDID', () => {
  beforeAll(() => {
    provider = new providers.JsonRpcProvider(jsonRpcUrl);
    pemKey = readFileSync(__dirname + pemPath, 'utf8');
  });
  it('should instantiate TLSDID object', () => {
    tlsDid = new TLSDID(pemKey, etherPrivateKey, provider);

    //Assert that tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should deploy new TLSDID contract', async () => {
    await tlsDid.deployContract();

    //Assert that contract has an address with the correct length
    address = tlsDid.getAddress();
    expect(address.length).toBe(42);
  });

  it('should connect to TLSDID contract', async () => {
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );

    //Assert that connecting to existing TLSDID Contract does not throw error
    expect(
      async () => await tlsDidVerificationDuplicate.connectToContract(address)
    ).not.toThrow();

    //Assert that connected TLSDID Contract has correct address
    expect(tlsDidVerificationDuplicate.getAddress()).toEqual(address);
  });

  it('should register TLSDID contract', async () => {
    const domain = 'example.org';
    await tlsDid.registerContract(domain);

    //Assert that DID to contract mapping is stored in registry
    const registry = new Contract(REGISTRY, TLSDIDRegistryJson.abi, provider);
    const addresses = await registry.getContracts(domain);
    expect(addresses.includes(tlsDid.getAddress())).toBeTruthy();

    //Assert that domain is stored TLSDID contract
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    await tlsDidVerificationDuplicate.connectToContract(address);
    expect(tlsDidVerificationDuplicate.domain).toBe(domain);
  });

  it('should add attribute to TLSDID contract', async () => {
    await tlsDid.addAttribute('parent/child', 'value');

    //Assert that the new attribute is stored in the TLSDID object
    const includedO = tlsDid.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedO).toBeTruthy();

    //Assert that the new attribute is stored in the TLSDID contract
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    const test = await tlsDidVerificationDuplicate.connectToContract(address);
    const includedC = tlsDidVerificationDuplicate.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedC).toBeTruthy();
  });

  it('should add expiry to TLSDID contract', async () => {
    const expiry = new Date('12 / 12 / 2040');
    await tlsDid.setExpiry(expiry);

    //Assert that expiry is updated in TLSDID object
    expect(tlsDid.expiry).toBe(expiry);

    //Assert that expiry is stored TLSDID contract
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    await tlsDidVerificationDuplicate.connectToContract(address);
    expect(tlsDidVerificationDuplicate.expiry).toStrictEqual(expiry);
  });
});
