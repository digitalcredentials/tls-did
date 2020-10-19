import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import TLSDIDRegistryJson from 'tls-did-registry/build/contracts/TLSDIDRegistry.json';
import TLSDID from '../index';

//TODO import from tls-did-registry or tls-did-resolver
const REGISTRY = '0xF7fBa67a3f6b05A9E0DA8DcB1f44aE037134eAE4';

//Tested with ganache
const jsonRpcUrl = 'http://localhost:8545';
const etherPrivateKey =
  '0xf31a1f53e94c46aea88507a237e1ae93e0e89afa4cdb499160d7f9579bd7ca5a';
const pemPath = '/ssl/private/testserver.pem';

describe('TLSDID', () => {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  const pemKey = readFileSync(__dirname + pemPath, 'utf8');
  let tlsDid;
  let address;
  it('should instantiate TLSDID object', () => {
    tlsDid = new TLSDID(pemKey, etherPrivateKey, provider);

    //Assert that tlsDid has been instantiated
    expect(tlsDid).toBeDefined();
  });

  it('should deploy new TLSDID contract', async () => {
    await tlsDid.deployContract();

    //Assert that contract has an address with the correct length
    address = tlsDid.contract?.address;
    expect(address.length).toBe(42);
  });

  it('should connect to TLSDID contract', async () => {
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    await tlsDidVerificationDuplicate.connectToContract(address);

    //Assert that connecting to existing TLSDID Contract results stored contract object with correct address
    expect(tlsDidVerificationDuplicate.contract.address).toBe(
      tlsDid.contract.address
    );

    //TODO Assert contracts with assigned values
  });

  it('should register TLSDID contract', async () => {
    const domain = 'example.org';
    const did = `did:tls:${domain}`;
    await tlsDid.registerContract(domain);

    //Assert that domain is stored TLSDID contract
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    await tlsDidVerificationDuplicate.connectToContract(address);
    expect(tlsDidVerificationDuplicate.domain).toBe(domain);

    //Assert that DID to contract mapping is stored in registry
    const registry = new ethers.Contract(
      REGISTRY,
      TLSDIDRegistryJson.abi,
      provider
    );
    const addresses = await registry.getContracts(did);
    expect(addresses.includes(tlsDid.contract.address)).toBeTruthy();
  });

  it('should sign TLSDID contract', async () => {
    await tlsDid.signContract();

    //Assert that signature is stored TLSDID contract
    const tlsDidVerificationDuplicate = new TLSDID(
      pemKey,
      etherPrivateKey,
      provider
    );
    await tlsDidVerificationDuplicate.connectToContract(address);
    expect(tlsDidVerificationDuplicate.signature).toBe(tlsDid.signature);

    //TODO assert that signature is correct
  });

  it('should add attribute to TLSDID contract', async () => {
    //TODO
  });
});
