import { providers } from 'ethers';
import { readFileSync } from 'fs';
import { TLSDID } from '../index';
import c from './testConfig.json';

//TODO import registry address from tls-did-registry or tls-did-resolver

const domain = 'did-tls.de';

describe('TLSDID object instantiation', () => {
  it('should instantiate TLSDID with rpcUrl', () => {
    let tlsDid = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should instantiate TLSDID with ethers provider', () => {
    let tlsDid = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        provider: new providers.JsonRpcProvider(c.jsonRpcUrl),
      },
    });
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });
});

describe('TLSDID operations', () => {
  let pemKey: string;
  let tlsDid: TLSDID;

  beforeAll(() => {
    pemKey = readFileSync(__dirname + c.privKeyPath, 'utf8');
    tlsDid = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
  });

  it('should add attribute to TLSDID contract', async () => {
    await tlsDid.addAttribute('parent/child', 'value', pemKey);

    //Assert that the new attribute is stored in the TLSDID object
    const includedO = tlsDid.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedO).toBeTruthy();

    //Assert that expiry is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    const includedC = tlsDidDuplicate.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedC).toBeTruthy();
    expect(tlsDidDuplicate.signature).toBe(tlsDid.signature);
  });

  it('should add expiry to TLSDID contract', async () => {
    const expiry = new Date('12 / 12 / 2040');
    await tlsDid.setExpiry(expiry, pemKey);

    //Assert that expiry is updated in TLSDID object
    expect(tlsDid.expiry).toBe(expiry);

    //Assert that expiry is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.expiry).toStrictEqual(expiry);
    expect(tlsDidDuplicate.signature).toBe(tlsDid.signature);
  });

  it('should register chain', async () => {
    //Register new chain
    const chain = [
      '-----BEGIN CERTIFICATE-----\nCertA\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nCertB\n-----END CERTIFICATE-----',
    ];
    await tlsDid.addChain(chain, pemKey);

    //Assert that expiry is stored TLSDID contract
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.chain).toEqual(chain);
  });

  it('should delete DID', async () => {
    await tlsDid.delete();

    //The last change block index should be reset and tls did objects values set to null
    expect(tlsDid.attributes).toEqual([]);
    expect(tlsDid.expiry).toEqual(null);
    expect(tlsDid.signature).toEqual(null);
    expect(tlsDid.chain).toEqual([]);
    //The registration however is not deleted in the registry contract
    expect(tlsDid.domain).toEqual(domain);
    expect(tlsDid.registered).toEqual(true);
  });
});
