# Documentation

The [tls-did](https://github.com/digitalcredentials/tls-did) and the [tls-did-resolver](https://github.com/digitalcredentials/tls-did) library allow to create, update, read and delete TLS-[Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs). Both libraries support JavaScript and TypeScript. The [tls-did-playground](https://github.com/digitalcredentials/tls-did-playground) shows an exemplary usage; how to create, update, resolve/read and delete TLS-DIDs.

## TLS-DID Operations

In this section we describe to use the [tls-did](https://github.com/digitalcredentials/tls-did) and the [tls-did-resolver](https://github.com/digitalcredentials/tls-did) library to run the four DID method operations.

### Create

To create a TLS-DID, import the tls-did library. First instantiate a TLS-DID object. The constructor expects:
* The private key of an ethereum account with sufficient funds.
* Optionally you can pass a [networkConfig](#networkConfig).

```javascript
import { TLSDID } from 'tls-did';

//Setup TLS-DID object
const tlsDid = new TLSDID(etherPrivateKey, {
      registry: REGISTRY_ADDRESS,
      providerConfig: {
        jsonRpcUrl: jsonRpcUrl),
      },
});
```

After you instantiated the TLS-DID object you can either deploy a new [TLSDID Contract](#TLSDID-Contract) to the Ethereum chain or connect to a previously deployed contract using its smart contract address. After deployment the smart contract address is stored in the TLS-DID object's address property.

```javascript
// Deploy new contract
await tlsDid.deployContract();
const address = tlsDid.address;
```

```javascript
// Connect to existing contract
await tlsDid.connectToContract(address)
```

In the next step you register the newly created [TLSDID Contract](#TLSDID-Contract) in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). The registerContract method expects the method specific identifier, a domain, and the domain's TLS private key.

```javascript
//Register TLSDIDContract in the TLSDIDRegistry
await tlsDid.registerContract(domain, pemKey)
```

In the final step you store the domain's TLS cert chain up to, **but not including the TLS root certificate**. You pass the cert chain as an array of pem encoded certs and the TLS private key to the addChain method. **Note** that the domain's certificate has to be the first element of the array and all intermediate certs should follow in their logical order.

```javascript
//Exemplary cert chain
const chain = [
  '-----BEGIN CERTIFICATE-----\nCert\n-----END CERTIFICATE-----',
  '-----BEGIN CERTIFICATE-----\nIntermediateCert\n-----END CERTIFICATE-----',
];
//Store cert chain in TLSDIDContract
await tlsDid.addChain(chain, pemKey);
```
### Update

To update or add information to the DID document the TLS-DID object has multiple methods.

You can add an expiry to your [TLSDID Contract](#TLSDID-Contract). After this date the contract is still readable, however the tls-did-resolver library will interpret this as an invalid contract and not resolve the DID.

```javascript
//Define expiry as an JS Data object
const expiry = new Date('12 / 12 / 2040');
//Add or update the expiry to/in the TLSDIDContract
await tlsDid.setExpiry(expiry, pemKey);
```

You can add attributes to your DID document with the addAttribute method. The addAttribute method
expects a path and value. The path resembles XPath. The value can currently only be a string. The [read/resolve](#read) constructs the DID document from the path/value combinations.

```javascript
//Adds {parent: {child: value}} to the DID document / TLSDIDContract
await tlsDid.addAttribute('parent/child', 'value', pemKey);
//Adds {array: [{element: value}]} to the DID document /TLSDIDContract
await tlsDid.addAttribute('arrayA[0]/element', 'value', pemKey);
//Adds {array: [value]} to the DID document / TLSDIDContract
await tlsDid.addAttribute('arrayB[0]', 'value', pemKey);
```
### Read

For reading two paths exist:

* The DID Controller reads the contract by connecting to the exiting TLSDID Contract](#TLSDID-Contract) as described in [Create](#Create). All available data is then accessible via the TLSDID object's properties. However, no validity check is performed when accessing data thru a [tls-did library](https://github.com/digitalcredentials/tls-did)  TLSDID object.

* To resolve a TLS-DID, import the getResolver function from [tls-did-resolver library](https://github.com/digitalcredentials/tls-did-resolver). When calling the getResolver function you can pass a [ProviderConfig](#ProviderConfig) (if none is passed the standard ganache testnet rpc url is used), a registry address and a string array of trusted TLS root certificates in the pem format. If you do not pass the root certificates, the library uses node's TLS root certificates. The getResolver function returns a tlsResolver object which can either be used with the [did-resolver library](https://github.com/decentralized-identity/did-resolver) or directly, by passing a TLS-DID to the tlsResolver object's tls method.

```javascript
import { Resolver } from 'did-resolver'
import { getResolver } from 'tls-did-resolver';

//Instantiate resolver
const tlsResolver = tls.getResolver(providerConfig, REGISTRY_ADDRESS, rootCerts);

//Resolve DID directly
const didDocument = await tlsResolver.tls('did:tls:tls-did.de', null, null);

//Use with did-tlsResolver
const resolver = new Resolver({
  ...ethrResolver,
  ...webResolver,
  ...tlsResolver
});

const didDocument = await resolver.resolve('did:tls:tls-did.de');
```

### Delete

To delete the TLS-DID, execute the TLSDID's delete method. This triggers the [TLSDID Contract's](#TLSDID-Contract) self destruct mechanism and will replace the reference to the [TLSDID Contract](#TLSDID-Contract) in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) with *0x0000000000000000000000000000000000000000*. *Note* that running the delete method will remove all information stored in the TLSDID object's properties.
```javascript
await tlsDid.delete();
```

## Smart Contracts
In this section we shortly describe the two ethereum smart contracts the TLS-DID method uses. For more information please follow the links to the commented contract code.

### TLSDID Contract

The [TLSDID Contract](https://github.com/digitalcredentials/tls-did-registry/blob/master/contracts/TLSDID.sol) stores the certificate chain, all data of the DID document, an expiry and a signature. The TLS-DID resolver uses the signature to verify all data stored in the contract against the TLS certificate of the domain for which the TLS-DID was created.

### TLSDIDRegistry Contract

The [TLSDIDRegistry Contract](https://github.com/digitalcredentials/tls-did-registry/blob/master/contracts/TLSDIDRegistry.sol) stores a mapping from TLS DIDs to one or multiple [TLSDID Contract's](#TLSDID-Contract) addresses.

## Data Types

In this section we describe some of data types the implementation repeatedly makes use of.

### ProviderConfig
The ProviderConfig can contain either a [ethers](https://github.com/ethers-io/ethers.js#readme) provider, a json rpc url, or a [web3 provider](https://web3js.readthedocs.io/en/v1.2.11/web3.html#providers).
```typescript
type ProviderConfig = {
  provider?: providers.Provider;
  rpcUrl?: string;
  web3?: any;
};
```
### NetworkConfig
The NetworkConfig can contain the smart contract address of the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract), if none is passed a fallback is used. However, currently no [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) is deployed to the Ethereum Mainnet. Furthermore, the NetworkConfig can contain a [ProviderConfig](#ProviderConfig).

```typescript
type NetworkConfig = {
  registry?: string;
  providerConfig?: ProviderConfig;
};
```
