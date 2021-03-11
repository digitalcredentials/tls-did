import { Contract, providers } from 'ethers';
import { readFileSync } from 'fs';
import TLSDIDRegistryContract from '@digitalcredentials/tls-did-registry/build/contracts/TLSDIDRegistry.json';
import { TLSDID } from '../index';
import c from './testConfig.json';

//TODO verify signatures after value updates
//TODO import registry address from tls-did-registry or tls-did-resolver

let pemKey: string;
let tlsDid: TLSDID;
let address: string;

describe('Event Driven TLS-DID', () => {
  beforeAll(() => {
    pemKey = readFileSync(__dirname + c.privKeyPath, 'utf8');
  });

  it('should instantiate TLSDID without provider and registry addresses', async () => {
    let tlsDid = new TLSDID(c.etherPrivKey);
    //Assert that the tlsDid has been instantiated
    expect(tlsDid).toBeDefined();

    console.log(await tlsDid.getEvents('tls-did.de'));
  });
});
