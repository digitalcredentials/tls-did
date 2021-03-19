import { providers } from 'ethers';
import { readFileSync } from 'fs';
import { TLSDID } from '../index';
import c from './testConfig.json';

const domain = 'did-tls.de';

describe('TLS-DID object instantiation', () => {
  it('should instantiate TLS-DID with rpcUrl', () => {
    let tlsDid = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should instantiate TLS-DID with ethers provider', () => {
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

describe('TLS-DID operations', () => {
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

  it('should register TLS-DID', async () => {
    await tlsDid.register();

    //Assert that expiry is updated in TLS-DID object
    expect(tlsDid.registered).toBeTruthy();

    //Assert that expiry is stored TLS-DID registry
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.registered).toBeTruthy();
  });

  it('should add attribute', async () => {
    await tlsDid.addAttribute('parent/child', 'value');

    //Assert that the new attribute is stored in the TLS-DID object
    const includedA = tlsDid.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedA).toBeTruthy();

    //Assert that expiry is stored TLS-DID registry
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    const includedB = tlsDidDuplicate.attributes.some((item) => {
      return item.path === 'parent/child' && item.value === 'value';
    });
    expect(includedB).toBeTruthy();
  });

  it('should add expiry', async () => {
    const expiry = new Date('12 / 12 / 2040');
    await tlsDid.setExpiry(expiry);

    //Assert that expiry is updated in TLS-DID object
    expect(tlsDid.expiry).toBe(expiry);

    //Assert that expiry is stored TLS-DID registry
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.expiry).toStrictEqual(expiry);
  });

  it('should add chain', async () => {
    //Register new chain
    const chain = [
      '-----BEGIN CERTIFICATE-----\nCertA\n-----END CERTIFICATE-----',
      '-----BEGIN CERTIFICATE-----\nCertB\n-----END CERTIFICATE-----',
    ];
    await tlsDid.addChain(chain);

    //Assert that expiry is stored TLS-DID registry
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.chain).toEqual(chain);
  });

  it('should add signature', async () => {
    await tlsDid.sign(pemKey);

    //Assert that expiry is stored TLS-DID registry
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

    expect(tlsDidDuplicate.signature).toEqual(tlsDid.signature);
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

    //Assert the TLS-DID registry last change block is set to 0
    const tlsDidDuplicate = new TLSDID(domain, c.etherPrivKey, {
      registry: c.registryAddress,
      providerConfig: {
        rpcUrl: c.jsonRpcUrl,
      },
    });
    await tlsDidDuplicate.loadDataFromRegistry();

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
