# Documentation

The [tls-did](https://github.com/digitalcredentials/tls-did) and the [tls-did-resolver](https://github.com/digitalcredentials/tls-did) library allow to create, update, read and delete TLS-[Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs). Both libraries support JavaScript and TypeScript. The [tls-did-playground](https://github.com/digitalcredentials/tls-did-playground) shows an exemplary usage; how to create, update, resolve/read and delete TLS-DIDs.

- [Documentation](#documentation)
  - [TLS-DID Operations](#tls-did-operations)
    - [Create](#create)
    - [Update](#update)
    - [Read](#read)
    - [Delete](#delete)
  - [Smart Contract](#smart-contract)
    - [TLSDIDRegistry Contract](#tlsdidregistry-contract)
  - [Data Types](#data-types)
    - [ProviderConfig](#providerconfig)
    - [NetworkConfig](#networkconfig)

## TLS-DID Operations

In this section we describe how to use the [tls-did](https://github.com/digitalcredentials/tls-did) and the [tls-did-resolver](https://github.com/digitalcredentials/tls-did) library to run the four DID method operations.

### Create

To create a TLS-DID, import the tls-did library. First instantiate a TLS-DID object. The constructor expects:
* The TLS-DID identifier, a domain
* The private key of an ethereum account with sufficient funds.
* Optionally you can pass a [networkConfig](#networkConfig).

```javascript
import { TLSDID } from 'tls-did';

//Setup TLS-DID object
const tlsDid = new TLSDID(domain, etherPrivateKey, {
      registry: REGISTRY_ADDRESS,
      providerConfig: {
        jsonRpcUrl: jsonRpcUrl),
      },
});
```

After you instantiated the TLS-DID object you can either claim control over a TLS-DID identifier (domain) or connect to an existing claim. Claims are stored as TLS-DID identifier (domain)/ethereum address combinations on the [TLS-DID Registry Contract](#TLSDIDRegistry-Contract). To connect to an existing claim you have to use a TLS-DID object instantiated with the same TLS-DID identifier (domain)/ethereum address combination.

**Note** that all methods storing data on chain allow you to set a optional gasLimit.

```javascript
//Register new claim
await tlsDid.register(optionalGasLimit);
```

```javascript
//Load data stored for existing
await tlsDid.loadDataFromRegistry()
```

In the next step, you store the domain's TLS cert chain up to, **but not including the TLS root certificate** on chain. You pass the cert chain as an array of pem encoded certs to the addChain method. **Note** that the domain's certificate has to be the first element of the array and all intermediate certs should follow in their logical order.

```javascript
//Exemplary cert chain
const chain = [
  '-----BEGIN CERTIFICATE-----\nCert\n-----END CERTIFICATE-----',
  '-----BEGIN CERTIFICATE-----\nIntermediateCert\n-----END CERTIFICATE-----',
];
//Store cert chain in on chain
await tlsDid.addChain(chain, optionalGasLimit);
```

In the final step, you store a signature of the previously stored data on chain. The data is signed with your domain's private TLS key in pem format.

```javascript
//Sign all data and store signature on chain
await tlsDid.sign(pemKey, optionalGasLimit);
```
### Update

To update or add information to the DID document the TLS-DID object has multiple methods.

You can add an expiry. If the expiry is in the past, you can still use `await tlsDid.loadDataFromRegistry()`, however the tls-did-resolver library will interpret this as an invalid claim.

```javascript
//Define expiry as an JS Data object
const expiry = new Date('12 / 12 / 2040');
//Add or update the expiry
await tlsDid.setExpiry(expiry, optionalGasLimit);
```

You can add attributes to your DID Document with the addAttribute method. The addAttribute method expects a path and value. The path resembles XPath. The value can currently only be a string. The [read/resolve](#read) constructs the DID document from the path/value combinations.

```javascript
//Adds {parent: {child: value}} to the DID document
await tlsDid.addAttribute('parent/child', 'value', optionalGasLimit);
//Adds {array: [{element: value}]} to the DID document
await tlsDid.addAttribute('arrayA[0]/element', 'value', optionalGasLimit);
//Adds {array: [value]} to the DID document
await tlsDid.addAttribute('arrayB[0]', 'value', optionalGasLimit);
```

To certify the updated data you have to sign the updated data. You can run multiple updates before signing. The data is signed with your domain's private TLS key in pem format.

```javascript
//Sign all data and store signature on chain
await tlsDid.sign(pemKey, optionalGasLimit);
```
### Read


To resolve a TLS-DID, import the getResolver function from [tls-did-resolver library](https://github.com/digitalcredentials/tls-did-resolver). When calling the getResolver function you can pass a [ProviderConfig](#ProviderConfig) (if none is passed the standard ganache testnet rpc url is used), a registry address and a string array of trusted TLS root certificates in the pem format. If you do not pass the root certificates, the library uses node's TLS root certificates. The getResolver function returns a tlsResolver object which can either be used with the [did-resolver library](https://github.com/decentralized-identity/did-resolver) or directly by passing a TLS-DID to the tlsResolver object's tls method.

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

Currently the TLS-DID libraries do not allow to resolve paths/fragments of the DID Document (https://github.com/digitalcredentials/tls-did/issues/28).

### Delete

To delete the TLS-DID, execute the TLSDID's delete method. This sets the last change block index to 0 in the [TLSDID Registry Contract](#TLSDIDRegistry-Contract). However, the claim (domain/ethereum address combination is not removed). *Note* that running the delete method will remove all information stored in the TLSDID object's properties.
```javascript
await tlsDid.delete();
```

## Smart Contract
In this section we shortly describe the TLS-DID Registry Contract.

### TLSDIDRegistry Contract

The [TLSDIDRegistry Contract](https://github.com/digitalcredentials/tls-did-registry/blob/master/contracts/TLSDIDRegistry.sol) stores claims to TLS-DID method specific identifiers (domains). A claim consists of a TLS-DID method specific identifier (domain) and an ethereum address. A claim points to a last change block number. Changes to a claim are stored as events on chain. The most recent change block number is stored in the registry. Events point to the previous event block number.

**State Variables**
Name | Function
--- | ---
changeRegistry | stores mapping from a ethereum address to a TLS-DID method specific identifiers (domain) to a last change block number.
claimantsRegistry | stores a mapping from TLS-DID method specific identifier (domain) to an array of ethereum addresses.

**Functions**
Name | Function
--- | ---
registerOwnership | Registers claim (domain/caller ethereum address)
getClaimantsCount | Gets count of claimants for domain
setExpiry | Sets expiry of a claim
setSignature | Sets signature of a claim
addAttribute | Sets attributes of a DID Document of a claim
addChain | Sets TLS certificate chain of a claim
remove | Sets change registry last change block to 0

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
