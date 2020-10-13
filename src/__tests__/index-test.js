import TLSDID from '../index';
import { ethers } from 'ethers';

//Tested with ganache
const jsonRpcUrl = 'http://localhost:8545';
const etherPrivateKey =
  '0xf1754dbf725be2b757071b8eec59eb544cad333b61fe33e73d8bb8c516b780bc';

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
    tlsDid.registerSmartContract('exampe.org');
    //TODO assert corectness
  });

  it('add attribute to TLSDID contract', async () => {
    //TODO test
  });
});
