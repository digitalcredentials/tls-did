import TLSDID from '../index';
import { ethers } from 'ethers';

//Tested with ganache
const jsonRpcUrl = 'http://localhost:8545';
const etherPrivateKey =
  '0x9333ead7beb5c0432341e2e36f4a7b7c5fb0715ba9d00b82ad7d9fcfcddf61b5';

describe('TLSDID', () => {
  const provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  let tlsDid;
  let address;

  it('instantiate TLSDID', () => {
    tlsDid = new TLSDID('', etherPrivateKey, provider);
    //TODO assert corectness
  });

  it('deploy new TLSDID contract', async () => {
    await tlsDid.deloySmartContract();
    address = tlsDid.contract.address;
    //TODO assert corectness
  });

  it('connect to TLSDID contract', async () => {
    tlsDid.connectToContract(address);
    //TODO assert corectness
  });

  it('register TLSDID contract', async () => {
    await tlsDid.registerSmartContract('example.org');
    //TODO assert corectness
  });

  it('add attribute to TLSDID contract', async () => {
    //TODO test
  });
});
