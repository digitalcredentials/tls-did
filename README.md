# Development

### Installation

```
npm i
```


### Test

```
npm run test
```

### Build

Should be run before each commit.

```
npm run build
```

# Documentation

The tls-did and the tls-did-resolver library allow to create, update, read and delete [Decentralized Identifiers](https://www.w3.org/TR/did-core/) (DIDs). Both libraries support JavaScript and TypeScript. The [tls-did-playground](https://github.com/digitalcredentials/tls-did-playground) shows an exemplary usage; how to create, update, resolve/read and delete TLS-DIDs.

## TLS-DID Method


[DID Method](https://www.w3.org/TR/did-core/#dfn-did-methods)

The TLS-DID method uses the existing TLS infrastructure to create and verify identities. With this method DIDs verifiably linked to existing domains can be created, if a TLS certificate was issued to the domain.

**Method Name**: tls

**TLS-DID Format**: did:tls:\<domain>

**Example TLS-DID**: did:tls:tls-did.de

## TLS-DID Operations

In this section we describe the four operations each DID method has to specify. We segment the description of each operation into the concept and an explanation of how to use the tls-did and the tls-did-resolver library to run the operation.
### Create

**Concept**

To create a TLS-DID we deploy a smart contract to the Ethereum blockchain. We register this contract in the TLS-DID registry smart contract with its TLS-DID method specific identifier. **Note** that we do not verify the correctness of an association between a TLS-DID and a domain on creation. Therefore, anyone can register a smart contract with any identifier. Thats why we verify each smart contract in the [read/resolve](#read) operation.

**Code**

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
await tlsDid.deployContract();
const address = tlsDid.address;
```

```javascript
await tlsDidDuplicate.connectToContract(address)
```

In the next step you register the newly created [TLSDID Contract](#TLSDID-Contract) in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). The registerContract method expects the domain for which you want to create a DID and the TLS private key.

```javascript
await tlsDid.registerContract(domain, pemKey)

```

In the final step you store the TLS cert chain up to, **but not including the TLS root certificate**. You pass the cert chain as an array of pem encoded certs. The domain certificate has to be the first element of the array and all intermediate certs should follow in their logical order.

```javascript
const chain = [
  '-----BEGIN CERTIFICATE-----\nCert\n-----END CERTIFICATE-----',
  '-----BEGIN CERTIFICATE-----\nIntermediateCert\n-----END CERTIFICATE-----',
];
await tlsDid.addChain(chain, pemKey);
```
### Update
**Concept**

We store the DID documents data in the [TLSDID Contract](#TLSDID-Contract). You can store all data as long as it complies to the JSON data format. This means however, that you are responsible that the data that you add, adheres to the [DID document data model specification](https://www.w3.org/TR/did-core/#data-model).

 Only the controller of the Ethereum account that created the [TLSDID Contract](#TLSDID-Contract) can update the contract and after each data update, the [TLSDID Contract's](#TLSDID-Contract) signature is updated using the TLS private key.

As an extension to the standard DID standard we allow you to store an expiry date in the [TLSDID Contract](#TLSDID-Contract). The contract is invalid if the current date is later then the stored expiry date.

**Code**

To update or add information to the DID Document the TLS-DID object has multiple methods.

You can add an expiry to your [TLSDID Contract](#TLSDID-Contract). After this date the contract is still readable, however the tls-did-resolver library will interpret this as an invalid contract and not resolve the DID.

```javascript
const expiry = new Date('12 / 12 / 2040');
await tlsDid.setExpiry(expiry, pemKey);
```

You can add attributes to your DID Document with the addAttribute method.
```javascript
//Adds {parent: {child: value}}
await tlsDid.addAttribute('parent/child', 'value', pemKey);
//Adds {array: [{element: value}]}
await tlsDid.addAttribute('arrayA[]/element', 'value', pemKey);
//Adds {array: [value]}
await tlsDid.addAttribute('arrayB[]', 'value', pemKey);
```
### Read
**Concept**

To resolve a TLS-DID we first query the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). This results in a set of 0-* [TLSDID Contract](#TLSDID-Contract) addresses. If zero addresses are available the TLS-DID is not existent. If one or more addresses were found we first load the stored TLS chain from the [TLSDID Contract](#TLSDID-Contract). We check each chain against a set of root certs. If a chain is valid we check the domain cert against the CA's OCSP if available. After these two first verification steps we discard all [TLSDID Contract](#TLSDID-Contract)s with invalid chains. Now we read all data from the remaining [TLSDID Contracts](#TLSDID-Contract) and verify the [TLSDID Contracts](#TLSDID-Contract) signature against the stored data and the verified domain cert. If this is valid we deem the [TLSDID Contract](#TLSDID-Contract) to be valid. If zero or more than one [TLSDID Contracts](#TLSDID-Contract) are valid the DID can not be resolved.

**Code**

For reading two paths exist:

* The DID Controller reads the contract by connecting to the exiting smart contract as described in [Create](#Create). All available data is the accessible via the TLS-DID object's properties.

* To resolve a TLS-DID, import the getResolver function from tls-did-resolver library. When calling the getResolver function you can pass a [ProviderConfig](#ProviderConfig) (if none is passed the standard ganache testnet rpc url is used), a registry address and a string array of trusted TLS root certificates in the pem format. If you do not pass the root certificates, node's TLS root certificates are used.

```javascript
import { getResolver } from 'tls-did-resolver';

//Instantiate resolver
const tlsResolver = tls.getResolver(providerConfig, REGISTRY_ADDRESS, rootCerts);

//Resolve DID
const didDocument = await tlsResolver.tls(`did:tls:tls-did.de`, null, null);
```

### Delete
**Concept**

To delete a TLS-DID we remove the corresponding smart contract from the Ethereum chain. Furthermore, we set the smart contract address stored in the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract) to *0x0000000000000000000000000000000000000000*.

**Code**

To delete the TLS-DID, execute the delete method. This triggers the [TLSDID Contract's](#TLSDID-Contract) self destruct and will remove the reference from the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). Note that running the delete method will remove all information stored in the tlsDid object's properties.
```javascript
await tlsDid.delete();
```

## Smart Contracts
In this section we shortly describe the two ethereum smart contracts TLS-DID method uses.

### TLSDID Contract

The [TLSDID Contract](https://github.com/digitalcredentials/tls-did-registry/blob/master/contracts/TLSDID.sol) stores all data of the DID document, an expiry and a signature. The TLS-DID resolver uses the signature to verify the stored data against the domain for which the TLS-DID was created.

### TLSDIDRegistry Contract

The [TLSDIDRegistry Contract](https://github.com/digitalcredentials/tls-did-registry/blob/master/contracts/TLSDIDRegistry.sol) stores a mapping from TLS DIDs to one or multiple [TLSDID Contract's](#TLSDID-Contract) addresses.

## Data types

In this section we describe data types the implementation repeatedly makes use of.

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
The NetworkConfig can contain the smart contract address of the [TLSDIDRegistry Contract](#TLSDIDRegistry-Contract). Currently none is deployed to the Ethereum Mainnet. Furthermore, the NetworkConfig can contain a [ProviderConfig](#ProviderConfig).

```typescript
type NetworkConfig = {
  registry?: string;
  providerConfig?: ProviderConfig;
};
```
